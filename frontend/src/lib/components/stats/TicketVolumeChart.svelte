<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import InfoTooltip from '$lib/components/InfoTooltip.svelte';
  import type { Ticket } from '../../../types/index.ts';
  import { STATUS_COLORS, STATUS_LABELS, STATUSES, monthKey, monthLabel, labelStep } from './statsUtils';

  let { tickets, loading = false }: { tickets: Ticket[]; loading?: boolean } = $props();

  const SVG_W = 800;
  const TPAD = { top: 20, right: 24, bottom: 44, left: 46 };
  const TCH = 200;
  const TIW = SVG_W - TPAD.left - TPAD.right;
  const TIH = TCH - TPAD.top - TPAD.bottom;

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

  const volumeByMonth = $derived.by(() =>
    allMonths.map((mo) => {
      const mt = tickets.filter((t) => monthKey(t.createdAt) === mo);
      return { month: mo, counts: Object.fromEntries(STATUSES.map((s) => [s, mt.filter((t) => t.status === s).length])), total: mt.length };
    })
  );

  const maxVol = $derived.by(() => Math.max(...volumeByMonth.map((d) => d.total), 1));

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
</script>

<Card>
  <CardHeader>
    <CardTitle class="flex items-center gap-1.5">
      Ticket Volume Over Time
      <InfoTooltip text="Number of tickets created each month, stacked and colored by their current status." />
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div class="flex flex-wrap gap-4 mb-4">
      {#each STATUSES as s}
        <span class="flex items-center gap-1.5 text-sm">
          <span class="size-2.5 rounded-full shrink-0" style="background:{STATUS_COLORS[s]}"></span>
          {STATUS_LABELS[s]}
        </span>
      {/each}
    </div>

    {#if loading}
      <div class="aspect-800/200 w-full rounded-lg bg-muted/60 animate-pulse"></div>
    {:else if tickets.length === 0}
      <div class="aspect-800/200 w-full flex items-center justify-center">
        <p class="text-center text-muted-foreground text-sm">No tickets yet.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <svg viewBox="0 0 {SVG_W} {TCH}" class="w-full min-w-100 aspect-800/200" aria-label="Ticket volume by month">
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
          <text
            x="12"
            y={TPAD.top + TIH / 2}
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="10"
            fill="currentColor"
            fill-opacity="0.4"
            transform="rotate(-90, 12, {TPAD.top + TIH / 2})"
            >Tickets</text
          >
        </svg>
      </div>
    {/if}
  </CardContent>
</Card>
