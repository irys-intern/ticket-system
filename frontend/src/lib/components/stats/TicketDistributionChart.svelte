<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import InfoTooltip from '$lib/components/InfoTooltip.svelte';
  import WarningIcon from 'phosphor-svelte/lib/WarningIcon';
  import type { Ticket } from '../../../types/index.ts';
  import {
    PRIORITY_ITEMS,
    CATEGORY_ITEMS,
    PRIORITY_COLORS,
    CATEGORY_COLORS,
    PRIORITY_DISPLAY,
    CATEGORY_DISPLAY,
  } from './statsUtils';

  let { agentTickets, loading = false }: { agentTickets: Ticket[]; loading?: boolean } = $props();

  let distGroupBy = $state<'priority' | 'category'>('priority');

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
</script>

<Card>
  <CardHeader>
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <CardTitle class="text-base flex items-center gap-1.5">
        Ticket Distribution
        <InfoTooltip text="How this agent's assigned tickets break down by priority or category." />
      </CardTitle>
      <div class="flex rounded-lg border border-input overflow-hidden text-sm">
        <button
          onclick={() => (distGroupBy = 'priority')}
          disabled={loading}
          class="px-3 py-1 transition-colors {distGroupBy === 'priority' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}"
        >Priority</button>
        <button
          onclick={() => (distGroupBy = 'category')}
          disabled={loading}
          class="px-3 py-1 border-l border-input transition-colors {distGroupBy === 'category' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}"
        >Category</button>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <div class="min-h-29 flex flex-col justify-center">
      {#if loading}
        <div class="h-29 w-full rounded-lg bg-muted animate-pulse"></div>
      {:else if agentTickets.length === 0}
        <p class="text-center text-muted-foreground text-sm">No tickets assigned to this agent.</p>
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
            <p class="flex items-start gap-1.5 text-xs text-yellow-600 dark:text-yellow-400 pt-1">
              <WarningIcon class="size-3.5 shrink-0 translate-y-0.5" /> {priorityWarning}
            </p>
          {/if}
        </div>
      {/if}
    </div>
  </CardContent>
</Card>
