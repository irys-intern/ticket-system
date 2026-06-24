<title>Admin Stats</title>

<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Label } from '$lib/components/ui/label';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import type { Ticket, User } from '../../../types';

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

  const selectClass =
    'h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring';

  let tickets = $state<Ticket[]>([]);
  let users = $state<User[]>([]);
  let groupBy = $state<GroupBy>('priority');
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
    const total = agentTickets.length;
    if (total === 0) return [];
    let cursor = -90;
    return (STATUSES as readonly Status[])
      .map((s) => {
        const count = agentTickets.filter((t) => t.status === s).length;
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
      { title: 'Total Assigned', value: agentTickets.length },
      { title: 'In Progress', value: by('in_progress'), color: STATUS_COLORS['in_progress'] },
      { title: 'Waiting', value: by('waiting_for_response'), color: STATUS_COLORS['waiting_for_response'] },
      { title: 'Resolved', value: by('resolved'), color: STATUS_COLORS['resolved'] }
    ];
  });

  onMount(async () => {
    const [ticketsRes, usersRes] = await Promise.all([
      fetch(PUBLIC_BACKEND_URL + '/tickets', { credentials: 'include' }),
      fetch(PUBLIC_BACKEND_URL + '/admin/users', { credentials: 'include' }),
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
          {#each Array(7) as _}
            <div class="rounded-xl bg-muted/30 p-4 space-y-2">
              <div class="h-3 w-20 rounded bg-muted"></div>
              <div class="h-8 w-12 rounded bg-muted"></div>
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
    </div>
  {:else}
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

        <!-- Donut chart -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {#if agentTickets.length === 0}
              <p class="text-center text-muted-foreground text-sm py-8">
                No tickets assigned to this agent.
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
  {/if}
</div>
