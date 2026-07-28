<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '$lib/components/ui/table';
  import InfoTooltip from '$lib/components/InfoTooltip.svelte';
  import type { Ticket, User } from '../../../types/index.ts';
  import { AGENT_LINE_COLORS, resolutionMs, fmtDays } from './statsUtils';

  let { agents, tickets, loading = false }: { agents: User[]; tickets: Ticket[]; loading?: boolean } = $props();

  const agentComparison = $derived.by(() =>
    agents
      .map((agent, i) => {
        const agentT = tickets.filter((t) => t.assignedTo === agent.id);
        const done = agentT.filter((t) => t.status === 'resolved' || t.status === 'closed');
        const avgMs = done.length ? done.reduce((s, t) => s + resolutionMs(t), 0) / done.length : null;
        return {
          agent,
          color: AGENT_LINE_COLORS[i % AGENT_LINE_COLORS.length],
          total: agentT.length,
          active: agentT.filter((t) => t.status !== 'resolved' && t.status !== 'closed').length,
          resolved: done.length,
          avgDays: avgMs !== null ? avgMs / 86_400_000 : null,
          rate: agentT.length > 0 ? done.length / agentT.length : 0,
        };
      })
      .sort((a, b) => b.total - a.total)
  );

  const columns = [
    { label: 'Agent' },
    { label: 'Total', info: 'All tickets ever assigned to this agent.' },
    { label: 'Active', info: 'Currently assigned tickets that are not yet resolved or closed.' },
    { label: 'Resolved', info: 'Tickets this agent has marked resolved or closed.' },
    { label: 'Avg Time', info: 'Average calendar days from creation to resolution or closure.' },
    { label: 'Resolution Rate', info: "Share of this agent's total tickets that have been resolved or closed." },
  ];
</script>

<Card>
  <CardHeader>
    <CardTitle class="flex items-center gap-1.5">
      Agent Comparison
      <InfoTooltip text="Side-by-side workload and performance metrics across all agents." />
    </CardTitle>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          {#each columns as h}
            <TableHead class={h.label === 'Agent' ? '' : h.label === 'Resolution Rate' ? '' : 'text-right'}>
              <span class="inline-flex items-center gap-1.5 {h.label !== 'Agent' && h.label !== 'Resolution Rate' ? 'justify-end w-full' : ''}">
                {h.label}
                {#if h.info}<InfoTooltip text={h.info} />{/if}
              </span>
            </TableHead>
          {/each}
        </TableRow>
      </TableHeader>
      <TableBody>
        {#if loading}
          {#each Array(4) as _}
            <TableRow>
              <TableCell>
                <div class="flex items-center gap-2">
                  <div class="size-2.5 rounded-full bg-muted animate-pulse shrink-0"></div>
                  <div class="h-4 w-32 rounded bg-muted animate-pulse"></div>
                </div>
              </TableCell>
              <TableCell><div class="h-3.5 w-10 rounded bg-muted animate-pulse ml-auto"></div></TableCell>
              <TableCell><div class="h-3.5 w-10 rounded bg-muted animate-pulse ml-auto"></div></TableCell>
              <TableCell><div class="h-3.5 w-10 rounded bg-muted animate-pulse ml-auto"></div></TableCell>
              <TableCell><div class="h-3.5 w-10 rounded bg-muted animate-pulse ml-auto"></div></TableCell>
              <TableCell>
                <div class="flex items-center gap-2 min-w-32">
                  <div class="flex-1 h-1.5 rounded-full bg-muted/40"></div>
                  <div class="h-3 w-8 rounded bg-muted animate-pulse"></div>
                </div>
              </TableCell>
            </TableRow>
          {/each}
        {:else if agents.length === 0}
          <TableRow>
            <TableCell colspan={columns.length} class="py-6 text-center text-muted-foreground">
              No agents found.
            </TableCell>
          </TableRow>
        {:else}
          {#each agentComparison as row (row.agent.id)}
            <TableRow>
              <TableCell>
                <div class="flex items-center gap-2">
                  <span class="size-2.5 rounded-full shrink-0" style="background:{row.color}"></span>
                  <span class="font-medium">{row.agent.name}</span>
                </div>
              </TableCell>
              <TableCell class="text-right tabular-nums">{row.total}</TableCell>
              <TableCell class="text-right tabular-nums text-muted-foreground">{row.active}</TableCell>
              <TableCell class="text-right tabular-nums">{row.resolved}</TableCell>
              <TableCell class="text-right tabular-nums">{fmtDays(row.avgDays)}</TableCell>
              <TableCell>
                <div class="flex items-center gap-2 min-w-32">
                  <div class="flex-1 h-1.5 rounded-full bg-muted/40">
                    <div class="h-full rounded-full transition-all" style="width:{(row.rate * 100).toFixed(0)}%;background:{row.color}"></div>
                  </div>
                  <span class="text-xs text-muted-foreground w-8 text-right tabular-nums">{(row.rate * 100).toFixed(0)}%</span>
                </div>
              </TableCell>
            </TableRow>
          {/each}
        {/if}
      </TableBody>
    </Table>
  </CardContent>
</Card>
