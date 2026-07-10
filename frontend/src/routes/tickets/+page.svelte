<title>All Tickets</title>
<script lang="ts">
  import { onMount } from 'svelte';
  import type { Ticket } from '../../types/index.ts';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import { Badge } from '$lib/components/ui/badge';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Label } from '$lib/components/ui/label';
  import BackLink from '$lib/components/BackLink.svelte';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';

  const statuses = ['all', 'open', 'in_progress', 'waiting_for_response', 'closed'];
  const PRIORITY_RANK: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };
  let statusFilter = $state('all');
  let searchQuery = $state('');
  let sortBy = $state('newest');
  let errors: string[] = $state([]);
  let tickets: Ticket[] = $state([]);
  let isLoading = $state(true);
  let userRole = $state('guest');
  let agentNames: Record<string, string> = $state({});
  let filteredTickets: Ticket[] = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    const result = tickets.filter((t: Ticket) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (!q) return true;
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    });
    if (sortBy === 'oldest') return [...result].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (sortBy === 'priority') return [...result].sort((a, b) => (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0));
    if (sortBy === 'agent') return [...result].sort((a, b) =>
      (agentNames[a.assignedTo ?? ''] ?? '').localeCompare(agentNames[b.assignedTo ?? ''] ?? ''));
    return [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  onMount(async () => {
    const response = await fetch(PUBLIC_BACKEND_URL+'/tickets', {credentials: 'include'});
    const result = await response.json();
    if (!response.ok) {
      errors = result.errors ?? [result.message ?? 'Unable to fetch tickets'];
      isLoading = false;
      return;
    }
    tickets = result.tickets ?? [];
    userRole = result.userRole || 'guest';
    if (userRole === 'agent') {
      statusFilter = 'in_progress';
    }
    if (userRole === 'admin') {
      const usersResponse = await fetch(PUBLIC_BACKEND_URL+'/admin/users', {credentials: 'include'});
      const usersResult = await usersResponse.json();
      if (usersResponse.ok) {
        agentNames = Object.fromEntries((usersResult.users ?? []).map((u: { id: string; name: string }) => [u.id, u.name]));
      }
    }
    isLoading = false;
  });

  const statusVariant = (s: string) =>
    s === 'open' ? 'secondary'
    : s === 'closed' ? 'outline'
    : 'default';

  const priorityVariant = (p: string) =>
    p === 'critical' || p === 'high' ? 'destructive'
    : 'secondary';

  const priorityClass = (p: string) =>
    p === 'critical' ? 'bg-destructive text-destructive-foreground dark:bg-destructive dark:text-destructive-foreground'
    : p === 'medium' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
    : '';

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

<div class="space-y-4">
  <div>
    <BackLink href={resolve('/')} />
  </div>

  <div class="flex flex-wrap items-center justify-between gap-3">
    <h1 class="text-2xl font-bold tracking-tight">My Tickets</h1>
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative">
        <MagnifyingGlassIcon class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          bind:value={searchQuery}
          placeholder="Search tickets…"
          class="h-8 rounded-lg border border-input bg-transparent pl-7 pr-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring w-48"
        />
      </div>
      <Label for="status-filter" class="text-sm">Status</Label>
      <select id="status-filter" bind:value={statusFilter}
        class="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring">
        {#each statuses as status (status)}
          <option value={status}>{status.replace(/_/g, ' ')}</option>
        {/each}
      </select>
      <Label for="sort-by" class="text-sm">Sort</Label>
      <select id="sort-by" bind:value={sortBy}
        class="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring">
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="priority">Priority</option>
        {#if userRole === 'admin'}
          <option value="agent">Agent</option>
        {/if}
      </select>
    </div>
  </div>

  {#if errors.length}
    <Alert variant="destructive">
      <AlertDescription>
        <ul class="list-disc list-inside space-y-1">
          {#each errors as error (error)}<li>{error}</li>{/each}
        </ul>
      </AlertDescription>
    </Alert>
  {/if}

  {#if filteredTickets.length === 0 && !errors.length && !isLoading}
    <p class="text-muted-foreground text-sm">No tickets found.</p>
  {/if}

  {#if isLoading}
    <div class="space-y-3">
      {#each Array(3).keys() as index (index)}
        <Card>
          <CardHeader>
            <CardTitle class="text-base"><div class="h-12 rounded-md bg-muted/40"></div></CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-3 animate-pulse">
              <div class="h-12 rounded-md bg-muted/40"></div>
              <div class="h-12 rounded-md bg-muted/40"></div>
              <div class="h-12 rounded-md bg-muted/40"></div>
            </div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {:else}
    <div class="space-y-3">
      {#each filteredTickets as ticket (ticket.id)}
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
              <Badge variant={priorityVariant(ticket.priority)} class={priorityClass(ticket.priority)}>{ticket.priority}</Badge>
              <Badge variant="ghost">{ticket.category.replace(/_/g, ' ')}</Badge>
              {#if userRole === 'admin'}
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
    {/each}
    </div>
  {/if}
</div>