<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Label } from '$lib/components/ui/label';
  import InfoTooltip from '$lib/components/InfoTooltip.svelte';
  import type { Ticket } from '../../../types/index.ts';
  import {
    STATUS_COLORS,
    STATUS_LABELS,
    STATUSES,
    PRIORITY_ORDER,
    CATEGORY_ORDER,
    PRIORITY_LABELS,
    CATEGORY_LABELS,
  } from './statsUtils';

  let { tickets, loading = false }: { tickets: Ticket[]; loading?: boolean } = $props();

  type GroupBy = 'priority' | 'category';

  const selectClass =
    'h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring';

  // SVG chart constants
  const PAD = { top: 24, right: 24, bottom: 48, left: 130 };
  const SVG_W = 800;
  const SVG_H = 300;
  const IW = SVG_W - PAD.left - PAD.right;
  const IH = SVG_H - PAD.top - PAD.bottom;

  let groupBy = $state<GroupBy>('priority');
  let hoveredTicket = $state<Ticket | null>(null);
  let mouseX = $state(0);
  let mouseY = $state(0);

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

<Card>
  <CardHeader>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <CardTitle class="flex items-center gap-1.5">
        Ticket Timeline
        <InfoTooltip text="Each dot is one ticket, plotted by how long it took to resolve (or how long it's been open, if still active) and colored by its current status." />
      </CardTitle>
      <div class="flex items-center gap-2">
        <Label for="group-by" class="text-sm whitespace-nowrap">Y axis</Label>
        <select id="group-by" bind:value={groupBy} disabled={loading} class="{selectClass} min-w-36">
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

    {#if loading}
      <div class="aspect-800/300 w-full rounded-lg bg-muted animate-pulse"></div>
    {:else}
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
          <div class="aspect-800/300 w-full flex items-center justify-center">
            <p class="text-center text-muted-foreground text-sm">No ticket data available.</p>
          </div>
        {:else}
          <svg
            viewBox="0 0 {SVG_W} {SVG_H}"
            class="w-full min-w-120 aspect-800/300"
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
    {/if}
  </CardContent>
</Card>
