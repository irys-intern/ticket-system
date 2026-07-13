<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import InfoTooltip from '$lib/components/InfoTooltip.svelte';
  import type { Ticket } from '../../../types/index.ts';
  import { STATUS_COLORS, STATUS_LABELS, STATUSES, type Status } from './statsUtils';

  let { agentTickets, loading = false }: { agentTickets: Ticket[]; loading?: boolean } = $props();

  // Donut chart geometry
  const DR = 90; // outer radius
  const DH = 54; // hole radius
  const DCX = 120;
  const DCY = 120;

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
</script>

<Card>
  <CardHeader>
    <CardTitle class="text-base flex items-center gap-1.5">
      Status Breakdown
      <InfoTooltip text="Distribution of this agent's currently active tickets by status. Closed tickets are excluded." />
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div class="min-h-44 flex items-center">
      {#if loading}
        <div class="h-44 w-full rounded-lg bg-muted animate-pulse"></div>
      {:else if donutData.length === 0}
        <p class="text-center text-muted-foreground text-sm w-full">
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
    </div>
  </CardContent>
</Card>
