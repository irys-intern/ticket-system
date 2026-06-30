<title>Admin Stats</title>

<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Label } from '$lib/components/ui/label';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import type { Ticket, User, AuditEvent } from '../../../types';

  type GroupBy = 'priority' | 'category';

  const PRIORITY_ORDER: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
  const CATEGORY_ORDER: Record<string, number> = { bug: 0, feature_request: 1, support: 2, other: 3 };
  const PRIORITY_LABELS = ['Low', 'Medium', 'High', 'Critical'];
  const CATEGORY_LABELS = ['Bug', 'Feature Req.', 'Support', 'Other'];

  const STATUS_COLORS: Record<string, string> = {
    open: '#3b82f6',
    in_progress: '#f97316',
    waiting_for_response: '#a855f7',
    resolved: '#22c55e',
    closed: '#6b7280',
  };
  const STATUS_LABELS: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    waiting_for_response: 'Waiting',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  const STATUSES = ['open', 'in_progress', 'waiting_for_response', 'resolved', 'closed'] as const;
  type Status = (typeof STATUSES)[number];

  // SVG chart constants
  const PAD = { top: 24, right: 24, bottom: 48, left: 130 };
  const SVG_W = 800;
  const SVG_H = 300;
  const IW = SVG_W - PAD.left - PAD.right;
  const IH = SVG_H - PAD.top - PAD.bottom;

  // Donut chart constants
  const DR = 90;   // outer radius
  const DH = 54;   // hole radius
  const DCX = 120;
  const DCY = 120;

  // Distribution bar chart
  const PRIORITY_COLORS: Record<string, string> = { low: '#22c55e', medium: '#f97316', high: '#ef4444', critical: '#dc2626' };
  const CATEGORY_COLORS: Record<string, string> = { bug: '#ef4444', feature_request: '#3b82f6', support: '#a855f7', other: '#6b7280' };
  const PRIORITY_ITEMS = ['critical', 'high', 'medium', 'low'] as const;
  const CATEGORY_ITEMS = ['bug', 'feature_request', 'support', 'other'] as const;
  const PRIORITY_DISPLAY: Record<string, string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
  const CATEGORY_DISPLAY: Record<string, string> = { bug: 'Bug', feature_request: 'Feature Req.', support: 'Support', other: 'Other' };

  const selectClass =
    'h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring';

  let tickets = $state<Ticket[]>([]);
  let users = $state<User[]>([]);
  let auditEvents = $state<AuditEvent[]>([]);
  let groupBy = $state<GroupBy>('priority');
  let distGroupBy = $state<'priority' | 'category'>('priority');
  let selectedAgentId = $state('');
  let loading = $state(true);
  let errors = $state<string[]>([]);
  let hoveredTicket = $state<Ticket | null>(null);
  let mouseX = $state(0);
  let mouseY = $state(0);

  const agents = $derived(users.filter((u) => u.role === 'agent'));
  const agentTickets = $derived(tickets.filter((t) => t.assignedTo === selectedAgentId));

  // --- Scatter chart ---
  // X = time-to-resolve for resolved/closed tickets; time-open-so-far for everything else.
  function ticketElapsedMs(t: Ticket): number {
    const created = new Date(t.createdAt).getTime();
    const updated = new Date(t.updatedAt).getTime();
    return updated > created ? updated - created : Date.now() - created;
  }

  const scatterData = $derived.by(() => {
    if (tickets.length === 0) return { points: [], xTicks: [], yLabels: [] as string[] };

    const visible = tickets.filter((t) => {
      if (t.status !== 'closed') return true;
      return new Date(t.updatedAt).getTime() !== new Date(t.createdAt).getTime();
    });

    if (visible.length === 0) return { points: [], xTicks: [], yLabels: [] as string[] };

    const elapsedMs = visible.map((t) => ticketElapsedMs(t));
    const maxE = Math.max(...elapsedMs) || 86_400_000;

    const yOrder = groupBy === 'priority' ? PRIORITY_ORDER : CATEGORY_ORDER;
    const yLabels = groupBy === 'priority' ? PRIORITY_LABELS : CATEGORY_LABELS;
    const yKey = (groupBy === 'priority' ? 'priority' : 'category') as 'priority' | 'category';
    const yMax = yLabels.length - 1;

    const points = visible.map((t, i) => ({
      cx: PAD.left + (elapsedMs[i] / maxE) * IW,
      cy: PAD.top + IH - ((yOrder[t[yKey]] ?? 0) / yMax) * IH,
      fill: STATUS_COLORS[t.status],
      ticket: t,
      elapsedDays: Math.round(elapsedMs[i] / 86_400_000),
    }));

    const xTicks = Array.from({ length: 5 }, (_, i) => ({
      x: PAD.left + (i / 4) * IW,
      label: `${Math.round(((i / 4) * maxE) / 86_400_000)}d`,
    }));

    return { points, xTicks, yLabels };
  });

  // --- Donut chart ---
  type DonutSlice = { status: Status; count: number; sweep: number; startAngle: number; endAngle: number };

  const donutData = $derived.by((): DonutSlice[] => {
    const activeTickets = agentTickets.filter((t) => t.status !== 'closed');
    const total = activeTickets.length;
    if (total === 0) return [];
    let cursor = -90;
    return (STATUSES.filter((s) => s !== 'closed') as readonly Status[])
      .map((s) => {
        const count = activeTickets.filter((t) => t.status === s).length;
        const rawSweep = (count / total) * 360;
        const sweep = Math.min(rawSweep, 359.9999);
        const startAngle = cursor;
        cursor += rawSweep;
        return { status: s, count, sweep, startAngle, endAngle: startAngle + sweep };
      })
      .filter((d) => d.count > 0);
  });

  function polarXY(r: number, deg: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: DCX + r * Math.cos(rad), y: DCY + r * Math.sin(rad) };
  }

  function arcPath(d: DonutSlice): string {
    const o1 = polarXY(DR, d.startAngle);
    const o2 = polarXY(DR, d.endAngle);
    const i2 = polarXY(DH, d.endAngle);
    const i1 = polarXY(DH, d.startAngle);
    const large = d.sweep > 180 ? 1 : 0;
    return [
      `M ${o1.x} ${o1.y}`,
      `A ${DR} ${DR} 0 ${large} 1 ${o2.x} ${o2.y}`,
      `L ${i2.x} ${i2.y}`,
      `A ${DH} ${DH} 0 ${large} 0 ${i1.x} ${i1.y}`,
      'Z',
    ].join(' ');
  }

  // --- Agent stat cards ---
  type StatCard = { title: string; value: number | string; suffix?: string; color?: string };

  const agentStats = $derived.by((): StatCard[] => {
    const by = (s: string) => agentTickets.filter((t) => t.status === s).length;
    const done = agentTickets.filter((t) => t.status === 'resolved' || t.status === 'closed');
    const avgMs = done.length
      ? done.reduce(
          (sum, t) =>
            sum + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()),
          0,
        ) / done.length
      : null;
    return [
      { title: 'In Progress', value: by('in_progress'), color: STATUS_COLORS['in_progress'] },
      { title: 'Waiting', value: by('waiting_for_response'), color: STATUS_COLORS['waiting_for_response'] },
      { title: 'Resolved', value: by('resolved'), color: STATUS_COLORS['resolved'] },
      { title: 'Closed', value: by('closed'), color: STATUS_COLORS['closed'] },
      { title: 'Lifetime Assigned', value: agentTickets.length },
      { title: 'Avg Resolution', value: avgMs !== null ? Math.round(avgMs / 86_400_000) : '—', suffix: avgMs !== null ? 'd' : undefined },
    ];
  });

  const priorityWarning = $derived.by((): string | null => {
    if (agentTickets.length < 5) return null;
    const total = agentTickets.length;
    const pct = (p: string) => agentTickets.filter((t) => t.priority === p).length / total;
    const critPct = pct('critical');
    const highPct = pct('high');
    const medPct = pct('medium');
    const maxPct = Math.max(pct('low'), medPct, highPct, critPct);
    if (maxPct > 0.8) return 'Nearly all tickets share one priority level! Classifications may not be organic.';
    if (critPct > 0.2) return 'Critical tickets exceed 20%. This may indicate over-escalation.';
    if (critPct > medPct) return 'More critical than medium tickets is atypical for a healthy queue.';
    if (highPct > medPct) return 'High-priority tickets outnumber medium! The distribution skew is unusually severe.';
    return null;
  });

  const avgTimeToAssignment = $derived.by((): string => {
    const assignments = auditEvents.filter((e) => e.action === 'ticket assigned');
    const earliest = new Map<string, number>();
    for (const e of assignments) {
      const key = String(e.ticketId);
      const t = new Date(e.createdAt).getTime();
      if (!earliest.has(key) || t < earliest.get(key)!) earliest.set(key, t);
    }
    const deltas: number[] = [];
    for (const [ticketId, assignedAt] of earliest) {
      const ticket = tickets.find((t) => String(t.id) === ticketId);
      if (!ticket) continue;
      const delta = assignedAt - new Date(ticket.createdAt).getTime();
      if (delta >= 0) deltas.push(delta);
    }
    if (deltas.length === 0) return '—';
    const avgMs = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    if (avgMs < 3_600_000) return `${Math.round(avgMs / 60_000)}m`;
    if (avgMs < 86_400_000) return `${(avgMs / 3_600_000).toFixed(1)}h`;
    return `${(avgMs / 86_400_000).toFixed(1)}d`;
  });

  const distData = $derived.by(() => {
    const items = distGroupBy === 'priority' ? PRIORITY_ITEMS : CATEGORY_ITEMS;
    const colors = distGroupBy === 'priority' ? PRIORITY_COLORS : CATEGORY_COLORS;
    const labels = distGroupBy === 'priority' ? PRIORITY_DISPLAY : CATEGORY_DISPLAY;
    const key = distGroupBy as 'priority' | 'category';
    const total = agentTickets.length;
    return items.map((item) => {
      const count = agentTickets.filter((t) => t[key] === item).length;
      return { key: item, label: labels[item], color: colors[item], count, pct: total > 0 ? count / total : 0 };
    });
  });

  // ── Time-series helpers ─────────────────────────────────────────────
  const AGENT_LINE_COLORS = ['#3b82f6','#f97316','#a855f7','#22c55e','#ec4899','#14b8a6','#eab308','#ef4444'];
  const TPAD = { top: 20, right: 24, bottom: 44, left: 46 };
  const TCH = 200;
  const TIW = SVG_W - TPAD.left - TPAD.right;
  const TIH = TCH - TPAD.top - TPAD.bottom;

  function monthKey(d: Date | string): string {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
  }
  function monthLabel(key: string): string {
    const [y, m] = key.split('-');
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
  function fmtDays(days: number | null): string {
    if (days === null) return '—';
    if (days < 1) return `${Math.round(days * 24)}h`;
    return `${days.toFixed(1)}d`;
  }
  function labelStep(n: number): number { return n <= 6 ? 1 : n <= 12 ? 2 : n <= 24 ? 3 : 6; }

  const allMonths = $derived.by((): string[] => {
    if (!tickets.length) return [];
    const keys = tickets.map(t => monthKey(t.createdAt));
    const minKey = keys.reduce((a, b) => (a < b ? a : b));
    const nowKey = monthKey(new Date());
    const out: string[] = [];
    let [y, m] = minKey.split('-').map(Number);
    for (;;) {
      const k = `${y}-${String(m).padStart(2, '0')}`;
      out.push(k);
      if (k >= nowKey) break;
      if (++m > 12) { m = 1; y++; }
    }
    return out;
  });

  const volumeByMonth = $derived.by(() =>
    allMonths.map(mo => {
      const mt = tickets.filter(t => monthKey(t.createdAt) === mo);
      return { month: mo, counts: Object.fromEntries(STATUSES.map(s => [s, mt.filter(t => t.status === s).length])), total: mt.length };
    })
  );

  const maxVol = $derived.by(() => Math.max(...volumeByMonth.map(d => d.total), 1));

  const barRects = $derived.by(() => {
    const n = allMonths.length;
    if (!n) return [];
    const slotW = TIW / n;
    const bw = Math.max(slotW * 0.65, 4);
    return volumeByMonth.map((d, i) => {
      const bx = TPAD.left + i * slotW + (slotW - bw) / 2;
      const rects: { y: number; h: number; s: string }[] = [];
      let bottom = TPAD.top + TIH;
      for (const s of STATUSES) {
        const count = d.counts[s] ?? 0;
        if (!count) continue;
        const h = (count / maxVol) * TIH;
        rects.push({ y: bottom - h, h, s });
        bottom -= h;
      }
      return { bx, bw, rects, month: d.month };
    });
  });

  const barLabelStep = $derived.by(() => labelStep(allMonths.length));

  const resTimeByMonth = $derived.by(() =>
    allMonths.map(mo => {
      const done = tickets.filter(t => (t.status === 'resolved' || t.status === 'closed') && monthKey(t.updatedAt) === mo);
      if (!done.length) return { month: mo, avgDays: null as number | null };
      return { month: mo, avgDays: done.reduce((s, t) => s + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()), 0) / done.length / 86_400_000 };
    })
  );

  const resTimeByAgent = $derived.by(() =>
    agents.slice(0, 6).map((agent, i) => ({
      agent,
      color: AGENT_LINE_COLORS[i % AGENT_LINE_COLORS.length],
      data: allMonths.map(mo => {
        const done = tickets.filter(t => t.assignedTo === agent.id && (t.status === 'resolved' || t.status === 'closed') && monthKey(t.updatedAt) === mo);
        if (!done.length) return null as number | null;
        return done.reduce((s, t) => s + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()), 0) / done.length / 86_400_000;
      }),
    }))
  );

  const maxResDay = $derived.by(() => Math.max(
    ...resTimeByMonth.filter(d => d.avgDays !== null).map(d => d.avgDays!),
    ...resTimeByAgent.flatMap(a => a.data.filter((d): d is number => d !== null)),
    1
  ));

  const resYTicks = $derived.by(() =>
    [0.25, 0.5, 0.75, 1].map(frac => ({ y: TPAD.top + TIH * (1 - frac), label: fmtDays(maxResDay * frac) }))
  );

  const lineXTicks = $derived.by(() => {
    const n = allMonths.length;
    const step = labelStep(n);
    return allMonths.flatMap((mo, i) => {
      if (i % step !== 0 && i !== n - 1) return [];
      return [{ x: TPAD.left + (n <= 1 ? TIW / 2 : (i / (n - 1)) * TIW), label: monthLabel(mo) }];
    });
  });

  const agentComparison = $derived.by(() =>
    agents.map((agent, i) => {
      const agentT = tickets.filter(t => t.assignedTo === agent.id);
      const done = agentT.filter(t => t.status === 'resolved' || t.status === 'closed');
      const avgMs = done.length ? done.reduce((s, t) => s + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()), 0) / done.length : null;
      return {
        agent, color: AGENT_LINE_COLORS[i % AGENT_LINE_COLORS.length],
        total: agentT.length,
        active: agentT.filter(t => t.status !== 'resolved' && t.status !== 'closed').length,
        resolved: done.length,
        avgDays: avgMs !== null ? avgMs / 86_400_000 : null,
        rate: agentT.length > 0 ? done.length / agentT.length : 0,
      };
    }).sort((a, b) => b.total - a.total)
  );

  function lineSegs(data: (number | null)[], maxVal: number): string[] {
    const n = allMonths.length;
    const xOf = (i: number) => TPAD.left + (n <= 1 ? TIW / 2 : (i / (n - 1)) * TIW);
    const yOf = (v: number) => TPAD.top + (1 - v / maxVal) * TIH;
    const segs: string[] = [];
    let cur: string[] = [];
    for (let i = 0; i < data.length; i++) {
      const v = data[i];
      if (v === null) { if (cur.length >= 2) segs.push(cur.join(' ')); cur = []; }
      else cur.push(`${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`);
    }
    if (cur.length >= 2) segs.push(cur.join(' '));
    return segs;
  }

  function lineDots(data: (number | null)[], maxVal: number): { x: number; y: number; v: number }[] {
    const n = allMonths.length;
    const xOf = (i: number) => TPAD.left + (n <= 1 ? TIW / 2 : (i / (n - 1)) * TIW);
    const yOf = (v: number) => TPAD.top + (1 - v / maxVal) * TIH;
    return data.flatMap((v, i) => v !== null ? [{ x: xOf(i), y: yOf(v), v }] : []);
  }

  onMount(async () => {
    const [ticketsRes, usersRes, auditRes] = await Promise.all([
      fetch(PUBLIC_BACKEND_URL + '/tickets', { credentials: 'include' }),
      fetch(PUBLIC_BACKEND_URL + '/admin/users', { credentials: 'include' }),
      fetch(PUBLIC_BACKEND_URL + '/admin/audit', { credentials: 'include' }),
    ]);

    const ticketsData = await ticketsRes.json();
    const usersData = await usersRes.json();

    if (!ticketsRes.ok) {
      errors = ticketsData.errors ?? ['Failed to load tickets'];
      loading = false;
      return;
    }
    if (!usersRes.ok) {
      errors = usersData.errors ?? ['Failed to load users'];
      loading = false;
      return;
    }

    tickets = ticketsData.tickets;
    users = usersData.users;
    if (auditRes.ok) {
      const auditData = await auditRes.json();
      auditEvents = auditData.events ?? [];
    }
    if (agents.length > 0) selectedAgentId = agents[0].id;
    loading = false;
  });
</script>

<!-- Floating tooltip -->
{#if hoveredTicket}
  <div
    role="tooltip"
    class="fixed z-50 rounded-lg border bg-popover px-3 py-2 text-sm shadow-md text-popover-foreground pointer-events-none max-w-64"
    style="left: {mouseX + 14}px; top: {mouseY - 70}px;"
  >
    <p class="font-semibold truncate">#{hoveredTicket.id} – {hoveredTicket.title}</p>
    <p class="text-muted-foreground capitalize mt-0.5">
      {STATUS_LABELS[hoveredTicket.status]} · {hoveredTicket.priority} · {hoveredTicket.category.replace(/_/g, ' ')}
    </p>
    <p class="text-muted-foreground text-xs mt-0.5">
      {(() => { const created = new Date(hoveredTicket.createdAt).getTime(); const updated = new Date(hoveredTicket.updatedAt).getTime(); return updated > created ? `${Math.round((updated - created) / 86_400_000)}d to resolve` : `${Math.round((Date.now() - created) / 86_400_000)}d open`; })()}
    </p>
  </div>
{/if}

<div class="space-y-6">
  <div>
    <a
      href={resolve('/')}
      class="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
      >&larr; Return home</a
    >
  </div>

  <h1 class="text-2xl font-bold tracking-tight">Admin Stats</h1>

  {#if errors.length}
    <Alert variant="destructive">
      <AlertDescription>
        {#each errors as e}<p>{e}</p>{/each}
      </AlertDescription>
    </Alert>
  {/if}

  {#if loading}
    <!-- Skeleton loader -->
    <div class="space-y-6 animate-pulse">
      <!-- Overall stats skeleton -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {#each Array(3) as _}
          <div class="rounded-xl bg-muted/30 p-4 space-y-2">
            <div class="h-3 w-24 rounded bg-muted"></div>
            <div class="h-8 w-16 rounded bg-muted"></div>
          </div>
        {/each}
      </div>
      <!-- Ticket Timeline skeleton -->
      <div class="rounded-xl bg-muted/30 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <div class="h-5 w-36 rounded-md bg-muted"></div>
          <div class="h-8 w-36 rounded-lg bg-muted"></div>
        </div>
        <div class="flex gap-4">
          {#each Array(5) as _}
            <div class="flex items-center gap-1.5">
              <div class="size-2.5 rounded-full bg-muted"></div>
              <div class="h-3.5 w-16 rounded bg-muted"></div>
            </div>
          {/each}
        </div>
        <div class="h-75 w-full rounded-lg bg-muted"></div>
      </div>

      <!-- Agent Performance skeleton -->
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="h-6 w-44 rounded-md bg-muted"></div>
          <div class="h-8 w-44 rounded-lg bg-muted"></div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {#each Array(5) as _}
            <div class="rounded-xl bg-muted/30 p-4 space-y-2">
              <div class="h-3 w-20 rounded bg-muted"></div>
              <div class="h-8 w-12 rounded bg-muted"></div>
            </div>
          {/each}
        </div>
        <div class="rounded-xl bg-muted/30 p-6 space-y-3">
          <div class="flex items-center justify-between">
            <div class="h-5 w-36 rounded-md bg-muted"></div>
            <div class="h-7 w-36 rounded-lg bg-muted"></div>
          </div>
          {#each Array(4) as _}
            <div class="flex items-center gap-3">
              <div class="h-3.5 w-24 rounded bg-muted shrink-0"></div>
              <div class="flex-1 h-4 rounded-full bg-muted"></div>
              <div class="h-3.5 w-6 rounded bg-muted"></div>
              <div class="h-3 w-10 rounded bg-muted"></div>
            </div>
          {/each}
        </div>
        <div class="rounded-xl bg-muted/30 p-6 space-y-4">
          <div class="h-5 w-32 rounded-md bg-muted"></div>
          <div class="flex items-center gap-8">
            <div class="size-44 rounded-full bg-muted shrink-0"></div>
            <div class="space-y-3 flex-1">
              {#each Array(4) as _}
                <div class="flex items-center gap-2.5">
                  <div class="size-3 rounded-full bg-muted"></div>
                  <div class="h-3.5 w-28 rounded bg-muted"></div>
                  <div class="h-3.5 w-6 rounded bg-muted ml-auto"></div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <!-- Comparison + time-series skeletons -->
      <div class="rounded-xl bg-muted/30 p-6 space-y-3">
        <div class="h-5 w-40 rounded-md bg-muted"></div>
        {#each Array(4) as _}
          <div class="flex items-center gap-4">
            <div class="h-4 w-32 rounded bg-muted shrink-0"></div>
            <div class="h-3.5 w-10 rounded bg-muted ml-auto"></div>
            <div class="h-3.5 w-10 rounded bg-muted"></div>
            <div class="h-3.5 w-10 rounded bg-muted"></div>
            <div class="h-3.5 w-10 rounded bg-muted"></div>
            <div class="h-2 flex-1 rounded-full bg-muted"></div>
          </div>
        {/each}
      </div>
      <div class="rounded-xl bg-muted/30 p-6 h-52">
        <div class="h-5 w-44 rounded-md bg-muted mb-4"></div>
        <div class="h-36 w-full rounded-lg bg-muted/60"></div>
      </div>
      <div class="rounded-xl bg-muted/30 p-6 h-52">
        <div class="h-5 w-52 rounded-md bg-muted mb-4"></div>
        <div class="h-36 w-full rounded-lg bg-muted/60"></div>
      </div>
    </div>
  {:else}
    <!-- ── Overall stats ────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Card>
        <CardHeader class="pb-1 pt-4">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Tickets</p>
        </CardHeader>
        <CardContent class="pb-4">
          <p class="text-3xl font-bold">{tickets.length}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="pb-1 pt-4">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Open & Unassigned</p>
        </CardHeader>
        <CardContent class="pb-4">
          <p class="text-3xl font-bold">{tickets.filter(t => t.status === 'open' && !t.assignedTo).length}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="pb-1 pt-4">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Time to Assignment</p>
        </CardHeader>
        <CardContent class="pb-4">
          <p class="text-3xl font-bold">{avgTimeToAssignment}</p>
        </CardContent>
      </Card>
    </div>

    <!-- ── Ticket Timeline ───────────────────────────────────────────── -->
    <Card>
      <CardHeader>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Ticket Timeline</CardTitle>
          <div class="flex items-center gap-2">
            <Label for="group-by" class="text-sm whitespace-nowrap">Y axis</Label>
            <select id="group-by" bind:value={groupBy} class="{selectClass} min-w-36">
              <option value="priority">Priority</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Legend -->
        <div class="flex flex-wrap gap-4 mb-4">
          {#each STATUSES as status}
            <span class="flex items-center gap-1.5 text-sm">
              <span
                class="size-2.5 rounded-full inline-block shrink-0"
                style="background-color: {STATUS_COLORS[status]}"
              ></span>
              {STATUS_LABELS[status]}
            </span>
          {/each}
        </div>

        <!-- SVG scatter chart -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="overflow-x-auto"
          onmousemove={(e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
          }}
        >
          {#if tickets.length === 0}
            <p class="text-center text-muted-foreground text-sm py-12">No ticket data available.</p>
          {:else}
            <svg
              viewBox="0 0 {SVG_W} {SVG_H}"
              class="w-full min-w-120"
              aria-label="Ticket timeline scatter chart"
            >
              <!-- Horizontal grid lines + Y labels -->
              {#each scatterData.yLabels as label, i}
                {@const y = PAD.top + IH - (i / (scatterData.yLabels.length - 1)) * IH}
                <line
                  x1={PAD.left}
                  x2={PAD.left + IW}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  stroke-opacity="0.08"
                />
                <text
                  x={PAD.left - 10}
                  y={y}
                  text-anchor="end"
                  dominant-baseline="middle"
                  font-size="12"
                  fill="currentColor"
                  fill-opacity="0.5">{label}</text
                >
              {/each}

              <!-- X axis ticks + labels -->
              {#each scatterData.xTicks as tick}
                <line
                  x1={tick.x}
                  x2={tick.x}
                  y1={PAD.top + IH}
                  y2={PAD.top + IH + 5}
                  stroke="currentColor"
                  stroke-opacity="0.2"
                />
                <text
                  x={tick.x}
                  y={PAD.top + IH + 18}
                  text-anchor="middle"
                  font-size="11"
                  fill="currentColor"
                  fill-opacity="0.5">{tick.label}</text
                >
              {/each}

              <!-- Axes -->
              <line
                x1={PAD.left}
                x2={PAD.left + IW}
                y1={PAD.top + IH}
                y2={PAD.top + IH}
                stroke="currentColor"
                stroke-opacity="0.2"
              />
              <line
                x1={PAD.left}
                x2={PAD.left}
                y1={PAD.top}
                y2={PAD.top + IH}
                stroke="currentColor"
                stroke-opacity="0.2"
              />

              <!-- Axis labels -->
              <text
                x={PAD.left + IW / 2}
                y={SVG_H - 6}
                text-anchor="middle"
                font-size="11"
                fill="currentColor"
                fill-opacity="0.4">Time Elapsed (days)</text
              >
              <text
                x="14"
                y={PAD.top + IH / 2}
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="11"
                fill="currentColor"
                fill-opacity="0.4"
                transform="rotate(-90, 14, {PAD.top + IH / 2})"
                >{groupBy === 'priority' ? 'Priority' : 'Category'}</text
              >

              <!-- Data points -->
              {#each scatterData.points as point (point.ticket.id)}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <a
                  href="/tickets/{point.ticket.id}"
                  aria-label={`View ticket ${point.ticket.id}`}
                  title={`View ticket ${point.ticket.id}`}
                >
                  <circle
                    cx={point.cx}
                    cy={point.cy}
                    r={hoveredTicket?.id === point.ticket.id ? 9 : 7}
                    fill={point.fill}
                    fill-opacity={hoveredTicket?.id === point.ticket.id ? 1 : 0.75}
                    stroke={point.fill}
                    stroke-width={hoveredTicket?.id === point.ticket.id ? 2.5 : 1}
                    class="cursor-pointer"
                    onmouseenter={() => (hoveredTicket = point.ticket)}
                    onmouseleave={() => (hoveredTicket = null)}
                  />
                </a>
              {/each}
            </svg>
          {/if}
        </div>
      </CardContent>
    </Card>

    <!-- ── Agent Performance ─────────────────────────────────────────── -->
    <div class="space-y-4">
      <div class="flex flex-wrap items-center gap-3">
        <h2 class="text-xl font-semibold tracking-tight">Agent Performance</h2>
        {#if agents.length > 0}
          <select bind:value={selectedAgentId} class="{selectClass} min-w-44">
            {#each agents as agent (agent.id)}
              <option value={agent.id}>{agent.name} ({agent.role})</option>
            {/each}
          </select>
        {:else}
          <span class="text-sm text-muted-foreground">No agents found.</span>
        {/if}
      </div>

      {#if selectedAgentId}
        <!-- Stat cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {#each agentStats as card}
            <Card>
              <CardHeader class="pb-1 pt-4">
                <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {card.title}
                </p>
              </CardHeader>
              <CardContent class="pb-4">
                <p class="text-3xl font-bold" style={card.color ? `color: ${card.color}` : ''}>
                  {card.value}{#if card.suffix}<span
                      class="text-base font-normal text-muted-foreground ml-1">{card.suffix}</span
                    >{/if}
                </p>
              </CardContent>
            </Card>
          {/each}
        </div>

        <!-- Distribution bar chart -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle class="text-base">Ticket Distribution</CardTitle>
              <div class="flex rounded-lg border border-input overflow-hidden text-sm">
                <button
                  onclick={() => (distGroupBy = 'priority')}
                  class="px-3 py-1 transition-colors {distGroupBy === 'priority' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}"
                >Priority</button>
                <button
                  onclick={() => (distGroupBy = 'category')}
                  class="px-3 py-1 border-l border-input transition-colors {distGroupBy === 'category' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}"
                >Category</button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {#if agentTickets.length === 0}
              <p class="text-center text-muted-foreground text-sm py-8">No tickets assigned to this agent.</p>
            {:else}
              <div class="space-y-3">
                {#each distData as row (row.key)}
                  <div class="flex items-center gap-3 text-sm">
                    <span class="w-24 text-right text-muted-foreground shrink-0">{row.label}</span>
                    <div class="flex-1 bg-muted/30 rounded-full h-4 overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-300"
                        style="width: {(row.pct * 100).toFixed(1)}%; background-color: {row.color}; {row.count === 0 ? 'min-width:0' : 'min-width: 4px'}"
                      ></div>
                    </div>
                    <span class="w-6 tabular-nums font-medium text-right">{row.count}</span>
                    <span class="w-10 text-right text-muted-foreground text-xs tabular-nums">{(row.pct * 100).toFixed(0)}%</span>
                  </div>
                {/each}
                {#if distGroupBy === 'priority' && priorityWarning}
                  <p class="text-xs text-yellow-600 dark:text-yellow-400 pt-1">⚠ {priorityWarning}</p>
                {/if}
              </div>
            {/if}
          </CardContent>
        </Card>

        <!-- Donut chart -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {#if donutData.length === 0}
              <p class="text-center text-muted-foreground text-sm py-8">
                No active tickets assigned to this agent.
              </p>
            {:else}
              <div class="flex flex-wrap items-center gap-8">
                <svg viewBox="0 0 240 240" class="w-44 h-44 shrink-0" aria-hidden="true">
                  {#each donutData as d (d.status)}
                    <path d={arcPath(d)} fill={STATUS_COLORS[d.status]} fill-opacity="0.85" />
                  {/each}
                </svg>
                <div class="space-y-2.5 text-sm">
                  {#each donutData as d (d.status)}
                    <div class="flex items-center gap-2.5">
                      <span
                        class="size-3 rounded-full shrink-0"
                        style="background-color: {STATUS_COLORS[d.status]}"
                      ></span>
                      <span class="text-muted-foreground w-28">{STATUS_LABELS[d.status]}</span>
                      <span class="font-semibold tabular-nums">{d.count}</span>
                      <span class="text-muted-foreground text-xs"
                        >{((d.count / agentTickets.length) * 100).toFixed(0)}%</span
                      >
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </CardContent>
        </Card>
      {/if}
    </div>

    <!-- ── Agent Comparison ──────────────────────────────────────────── -->
    <Card>
      <CardHeader><CardTitle>Agent Comparison</CardTitle></CardHeader>
      <CardContent>
        {#if agents.length === 0}
          <p class="text-center text-muted-foreground text-sm py-8">No agents found.</p>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border text-left">
                  {#each ['Agent','Total','Active','Resolved','Avg Time','Resolution Rate'] as h}
                    <th class="pb-2.5 {h === 'Agent' ? 'pr-6' : h === 'Resolution Rate' ? 'pl-4' : 'px-4 text-right'} text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each agentComparison as row (row.agent.id)}
                  <tr class="border-b border-border/40 last:border-0">
                    <td class="py-3 pr-6">
                      <div class="flex items-center gap-2">
                        <span class="size-2.5 rounded-full shrink-0" style="background:{row.color}"></span>
                        <span class="font-medium">{row.agent.name}</span>
                      </div>
                    </td>
                    <td class="py-3 px-4 text-right tabular-nums">{row.total}</td>
                    <td class="py-3 px-4 text-right tabular-nums text-muted-foreground">{row.active}</td>
                    <td class="py-3 px-4 text-right tabular-nums">{row.resolved}</td>
                    <td class="py-3 px-4 text-right tabular-nums">{fmtDays(row.avgDays)}</td>
                    <td class="py-3 pl-4">
                      <div class="flex items-center gap-2 min-w-32">
                        <div class="flex-1 h-1.5 rounded-full bg-muted/40">
                          <div class="h-full rounded-full transition-all" style="width:{(row.rate * 100).toFixed(0)}%;background:{row.color}"></div>
                        </div>
                        <span class="text-xs text-muted-foreground w-8 text-right tabular-nums">{(row.rate * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- ── Ticket Volume Over Time ────────────────────────────────────── -->
    <Card>
      <CardHeader><CardTitle>Ticket Volume Over Time</CardTitle></CardHeader>
      <CardContent>
        {#if tickets.length === 0}
          <p class="text-center text-muted-foreground text-sm py-8">No tickets yet.</p>
        {:else}
          <div class="flex flex-wrap gap-4 mb-4">
            {#each STATUSES as s}
              <span class="flex items-center gap-1.5 text-sm">
                <span class="size-2.5 rounded-full shrink-0" style="background:{STATUS_COLORS[s]}"></span>
                {STATUS_LABELS[s]}
              </span>
            {/each}
          </div>
          <div class="overflow-x-auto">
            <svg viewBox="0 0 {SVG_W} {TCH}" class="w-full min-w-100" aria-label="Ticket volume by month">
              {#each [0.25, 0.5, 0.75, 1] as frac}
                {@const y = TPAD.top + TIH * (1 - frac)}
                <line x1={TPAD.left} x2={TPAD.left + TIW} y1={y} y2={y} stroke="currentColor" stroke-opacity="0.08"/>
                <text x={TPAD.left - 5} y={y} text-anchor="end" dominant-baseline="middle" font-size="10" fill="currentColor" fill-opacity="0.5">{Math.round(maxVol * frac)}</text>
              {/each}
              <line x1={TPAD.left} x2={TPAD.left + TIW} y1={TPAD.top + TIH} y2={TPAD.top + TIH} stroke="currentColor" stroke-opacity="0.15"/>
              {#each barRects as bar, i}
                {#each bar.rects as rect}
                  <rect x={bar.bx} y={rect.y} width={bar.bw} height={rect.h} fill={STATUS_COLORS[rect.s]} fill-opacity="0.85" rx="1"/>
                {/each}
                {#if i % barLabelStep === 0 || i === barRects.length - 1}
                  <text x={bar.bx + bar.bw / 2} y={TPAD.top + TIH + 14} text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.5">{monthLabel(bar.month)}</text>
                {/if}
              {/each}
            </svg>
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- ── Resolution Time Over Time ─────────────────────────────────── -->
    <Card>
      <CardHeader><CardTitle>Resolution Time Over Time</CardTitle></CardHeader>
      <CardContent>
        {#if tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length === 0}
          <p class="text-center text-muted-foreground text-sm py-8">No resolved tickets yet.</p>
        {:else}
          <div class="flex flex-wrap gap-x-5 gap-y-2 mb-4 text-sm">
            <span class="flex items-center gap-2">
              <svg width="20" height="10" aria-hidden="true"><line x1="0" y1="5" x2="20" y2="5" stroke="currentColor" stroke-opacity="0.4" stroke-width="1.5" stroke-dasharray="4 3"/></svg>
              <span class="text-muted-foreground">Team avg</span>
            </span>
            {#each resTimeByAgent as a}
              <span class="flex items-center gap-2">
                <svg width="20" height="10" aria-hidden="true"><line x1="0" y1="5" x2="20" y2="5" stroke={a.color} stroke-width="2" stroke-opacity="0.8"/></svg>
                <span class="text-muted-foreground">{a.agent.name}</span>
              </span>
            {/each}
          </div>
          <div class="overflow-x-auto">
            <svg viewBox="0 0 {SVG_W} {TCH}" class="w-full min-w-100" aria-label="Resolution time over time">
              {#each resYTicks as tick}
                <line x1={TPAD.left} x2={TPAD.left + TIW} y1={tick.y} y2={tick.y} stroke="currentColor" stroke-opacity="0.08"/>
                <text x={TPAD.left - 5} y={tick.y} text-anchor="end" dominant-baseline="middle" font-size="10" fill="currentColor" fill-opacity="0.5">{tick.label}</text>
              {/each}
              <line x1={TPAD.left} x2={TPAD.left + TIW} y1={TPAD.top + TIH} y2={TPAD.top + TIH} stroke="currentColor" stroke-opacity="0.15"/>
              {#each lineXTicks as tick}
                <text x={tick.x} y={TPAD.top + TIH + 14} text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.5">{tick.label}</text>
              {/each}
              {#each resTimeByAgent as a}
                {#each lineSegs(a.data, maxResDay) as pts}
                  <polyline points={pts} fill="none" stroke={a.color} stroke-width="1.5" stroke-opacity="0.8"/>
                {/each}
                {#each lineDots(a.data, maxResDay) as d}
                  <circle cx={d.x} cy={d.y} r="2.5" fill={a.color}/>
                {/each}
              {/each}
              {#each lineSegs(resTimeByMonth.map(d => d.avgDays), maxResDay) as pts}
                <polyline points={pts} fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" stroke-opacity="0.35"/>
              {/each}
              {#each lineDots(resTimeByMonth.map(d => d.avgDays), maxResDay) as d}
                <circle cx={d.x} cy={d.y} r="2" fill="currentColor" fill-opacity="0.35"/>
              {/each}
            </svg>
          </div>
        {/if}
      </CardContent>
    </Card>

  {/if}
</div>
