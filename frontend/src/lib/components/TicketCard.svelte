<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import { Badge } from '$lib/components/ui/badge';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import PriorityBadge from '$lib/components/PriorityBadge.svelte';
  import type { Ticket } from '../../types/index.ts';
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';

  let {
    ticket,
    userRole = 'guest',
    agentNames = {},
  }: {
    ticket: Ticket;
    userRole?: string;
    agentNames?: Record<string, string>;
  } = $props();

  const statusVariant = (s: string) =>
    s === 'open' ? 'secondary'
    : s === 'closed' ? 'outline'
    : 'default';

  const formatRelativeTime = (date: string | Date) => {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };
</script>

<a href={resolve(`/tickets/${ticket.id}`)} onclick={(e) => { e.preventDefault(); goto(resolve(`/tickets/${ticket.id}`)); }} class="group block">
  <Card class="transition-shadow hover:shadow-sm hover:ring-foreground/20">
    <CardHeader class="pb-2">
      <div class="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span class="font-mono">#{ticket.id}</span>
        <span>{formatRelativeTime(ticket.createdAt)}</span>
      </div>
      <div class="flex items-start justify-between gap-2">
        <CardTitle class="text-base">{ticket.title}</CardTitle>
        <ArrowRightIcon class="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <div class="flex flex-wrap items-center gap-1.5 mt-1.5">
        <Badge variant={statusVariant(ticket.status)}>{ticket.status.replace(/_/g, ' ')}</Badge>
        <PriorityBadge priority={ticket.priority} />
        <Badge variant="ghost">{ticket.category.replace(/_/g, ' ')}</Badge>
        {#if userRole === 'admin'}
          <Badge variant="outline">{agentNames[ticket.createdBy] ?? 'Unknown user'}</Badge>
          <Badge variant="outline">{ticket.assignedTo ? (agentNames[ticket.assignedTo] ?? 'Unknown agent') : 'Unassigned'}</Badge>
        {/if}
      </div>
    </CardHeader>
    {#if ticket.description}
      <CardContent class="pb-3 pt-0">
        <p class="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
      </CardContent>
    {/if}
  </Card>
</a>
