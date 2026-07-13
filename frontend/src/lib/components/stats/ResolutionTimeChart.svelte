<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import InfoTooltip from '$lib/components/InfoTooltip.svelte';
  import type { Ticket, User } from '../../../types/index.ts';
  import { AGENT_LINE_COLORS, resolutionMs, monthKey, monthLabel, fmtDays, labelStep } from './statsUtils';

  let { tickets, agents, loading = false }: { tickets: Ticket[]; agents: User[]; loading?: boolean } = $props();

  const SVG_W = 800;
  const TPAD = { top: 20, right: 24, bottom: 44, left: 46 };
  const TCH = 200;
  const TIW = SVG_W - TPAD.left - TPAD.right;
  const TIH = TCH - TPAD.top - TPAD.bottom;

  let hoveredAgentId = $state<string | null>(null);

  const allMonths = $derived.by((): string[] => {
    if (!tickets.length) return [];
    const keys = tickets.map((t) => monthKey(t.createdAt));
    const minKey = keys.reduce((a, b) => (a < b ? a : b));
    const nowKey = monthKey(new Date());
    const out: string[] = [];
    let [y, m] = minKey.split('-').map(Number);
    for (;;) {
      const k = `${y}-${String(m).padStart(2, '0')}`;
      out.push(k);
      if (k >= nowKey) break;
      if (++m > 12) {
        m = 1;
        y++;
      }
    }
    return out;
  });

  const resTimeByMonth = $derived.by(() =>
    allMonths.map((mo) => {
      const done = tickets.filter((t) => (t.status === 'resolved' || t.status === 'closed') && monthKey(t.updatedAt) === mo);
      if (!done.length) return { month: mo, avgDays: null as number | null };
      return { month: mo, avgDays: done.reduce((s, t) => s + resolutionMs(t), 0) / done.length / 86_400_000 };
    })
  );

  const resTimeByAgent = $derived.by(() =>
    [...agents]
      .sort((a, b) => tickets.filter((t) => t.assignedTo === b.id).length - tickets.filter((t) => t.assignedTo === a.id).length)
      .slice(0, AGENT_LINE_COLORS.length)
      .map((agent, i) => ({
        agent,
        color: AGENT_LINE_COLORS[i % AGENT_LINE_COLORS.length],
        data: allMonths.map((mo) => {
          const done = tickets.filter((t) => t.assignedTo === agent.id && (t.status === 'resolved' || t.status === 'closed') && monthKey(t.updatedAt) === mo);
          if (!done.length) return null as number | null;
          return done.reduce((s, t) => s + resolutionMs(t), 0) / done.length / 86_400_000;
        }),
      }))
  );

  const maxResDay = $derived.by(() =>
    Math.max(
      ...resTimeByMonth.filter((d) => d.avgDays !== null).map((d) => d.avgDays!),
      ...resTimeByAgent.flatMap((a) => a.data.filter((d): d is number => d !== null)),
      1
    )
  );

  const resYTicks = $derived.by(() =>
    [0.25, 0.5, 0.75, 1].map((frac) => ({ y: TPAD.top + TIH * (1 - frac), label: fmtDays(maxResDay * frac) }))
  );

  const lineXTicks = $derived.by(() => {
    const n = allMonths.length;
    const step = labelStep(n);
    return allMonths.flatMap((mo, i) => {
      if (i % step !== 0 && i !== n - 1) return [];
      return [{ x: TPAD.left + (n <= 1 ? TIW / 2 : (i / (n - 1)) * TIW), label: monthLabel(mo) }];
    });
  });

  function lineSegs(data: (number | null)[], maxVal: number): string[] {
    const n = allMonths.length;
    const xOf = (i: number) => TPAD.left + (n <= 1 ? TIW / 2 : (i / (n - 1)) * TIW);
    const yOf = (v: number) => TPAD.top + (1 - v / maxVal) * TIH;
    const segs: string[] = [];
    let cur: string[] = [];
    for (let i = 0; i < data.length; i++) {
      const v = data[i];
      if (v === null) {
        if (cur.length >= 2) segs.push(cur.join(' '));
        cur = [];
      } else cur.push(`${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`);
    }
    if (cur.length >= 2) segs.push(cur.join(' '));
    return segs;
  }

  function lineDots(data: (number | null)[], maxVal: number): { x: number; y: number; v: number }[] {
    const n = allMonths.length;
    const xOf = (i: number) => TPAD.left + (n <= 1 ? TIW / 2 : (i / (n - 1)) * TIW);
    const yOf = (v: number) => TPAD.top + (1 - v / maxVal) * TIH;
    return data.flatMap((v, i) => (v !== null ? [{ x: xOf(i), y: yOf(v), v }] : []));
  }
</script>

<Card>
  <CardHeader>
    <CardTitle class="flex items-center gap-1.5">
      Resolution Time Over Time
      <InfoTooltip text="Average days-to-resolve for tickets resolved or closed each month, shown per agent and as a team-wide dashed average." />
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div class="flex flex-wrap gap-x-5 gap-y-2 mb-4 text-sm">
      <span class="flex items-center gap-2">
        <svg width="20" height="10" aria-hidden="true"><line x1="0" y1="5" x2="20" y2="5" stroke="currentColor" stroke-opacity="0.4" stroke-width="1.5" stroke-dasharray="4 3"/></svg>
        <span class="text-muted-foreground">Team avg</span>
      </span>
      {#each resTimeByAgent as a}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
          class="flex items-center gap-2 cursor-default rounded px-1 -mx-1 transition-colors {hoveredAgentId === a.agent.id ? 'bg-muted/60' : ''}"
          onmouseenter={() => (hoveredAgentId = a.agent.id)}
          onmouseleave={() => (hoveredAgentId = null)}
        >
          <svg width="20" height="10" aria-hidden="true"><line x1="0" y1="5" x2="20" y2="5" stroke={a.color} stroke-width="2" stroke-opacity="0.8"/></svg>
          <span class={hoveredAgentId === a.agent.id ? 'text-foreground font-medium' : 'text-muted-foreground'}>{a.agent.name}</span>
        </span>
      {/each}
    </div>
    {#if agents.length > AGENT_LINE_COLORS.length}
      <p class="text-xs text-muted-foreground mb-4">
        Showing the {AGENT_LINE_COLORS.length} agents with the most assigned tickets, out of {agents.length} total.
      </p>
    {/if}

    {#if loading}
      <div class="aspect-800/200 w-full rounded-lg bg-muted/60 animate-pulse"></div>
    {:else if tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length === 0}
      <div class="aspect-800/200 w-full flex items-center justify-center">
        <p class="text-center text-muted-foreground text-sm">No resolved tickets yet.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <svg viewBox="0 0 {SVG_W} {TCH}" class="w-full min-w-100 aspect-800/200" aria-label="Resolution time over time">
          {#each resYTicks as tick}
            <line x1={TPAD.left} x2={TPAD.left + TIW} y1={tick.y} y2={tick.y} stroke="currentColor" stroke-opacity="0.08"/>
            <text x={TPAD.left - 5} y={tick.y} text-anchor="end" dominant-baseline="middle" font-size="10" fill="currentColor" fill-opacity="0.5">{tick.label}</text>
          {/each}
          <line x1={TPAD.left} x2={TPAD.left + TIW} y1={TPAD.top + TIH} y2={TPAD.top + TIH} stroke="currentColor" stroke-opacity="0.15"/>
          {#each lineXTicks as tick}
            <text x={tick.x} y={TPAD.top + TIH + 14} text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.5">{tick.label}</text>
          {/each}
          {#each resTimeByAgent as a}
            {@const isHovered = hoveredAgentId === a.agent.id}
            {@const isDimmed = hoveredAgentId !== null && !isHovered}
            {#each lineSegs(a.data, maxResDay) as pts}
              <polyline
                points={pts}
                fill="none"
                stroke={a.color}
                stroke-width={isHovered ? 3 : 1.5}
                stroke-opacity={isDimmed ? 0.15 : 0.8}
              />
            {/each}
            {#each lineDots(a.data, maxResDay) as d}
              <circle cx={d.x} cy={d.y} r={isHovered ? 3.5 : 2.5} fill={a.color} fill-opacity={isDimmed ? 0.15 : 1} />
            {/each}
          {/each}
          {#each lineSegs(resTimeByMonth.map((d) => d.avgDays), maxResDay) as pts}
            <polyline points={pts} fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" stroke-opacity={hoveredAgentId ? 0.12 : 0.35}/>
          {/each}
          {#each lineDots(resTimeByMonth.map((d) => d.avgDays), maxResDay) as d}
            <circle cx={d.x} cy={d.y} r="2" fill="currentColor" fill-opacity={hoveredAgentId ? 0.12 : 0.35}/>
          {/each}
          <text
            x="12"
            y={TPAD.top + TIH / 2}
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="10"
            fill="currentColor"
            fill-opacity="0.4"
            transform="rotate(-90, 12, {TPAD.top + TIH / 2})"
            >Avg days to resolve</text
          >
        </svg>
      </div>
    {/if}
  </CardContent>
</Card>
