<title>All Tickets</title>
<script lang="ts">
  import { onMount } from 'svelte';
  import type { Ticket } from '../../types/index.ts';
  import { resolve } from '$app/paths';
  import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Label } from '$lib/components/ui/label';
  import BackLink from '$lib/components/BackLink.svelte';
  import TicketCard from '$lib/components/TicketCard.svelte';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';

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
</script>

<div class="flex-1 min-h-0 flex flex-col space-y-4">
  <div class="shrink-0">
    <BackLink href={resolve('/')} />
  </div>

  <div class="flex flex-wrap items-center justify-between gap-3 shrink-0">
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
        class="h-8 w-28 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring">
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
    <Alert variant="destructive" class="shrink-0">
      <AlertDescription>
        <ul class="list-disc list-inside space-y-1">
          {#each errors as error (error)}<li>{error}</li>{/each}
        </ul>
      </AlertDescription>
    </Alert>
  {/if}

  {#if filteredTickets.length === 0 && !errors.length && !isLoading}
    <p class="text-muted-foreground text-sm shrink-0">No tickets found.</p>
  {/if}

  {#if isLoading}
    <div class="skeleton-fade-in space-y-3 overflow-y-auto min-h-0 flex-1 pt-1 pl-1 pr-1 pb-4 -mt-1 -ml-1 -mr-1">
      {#each Array(3).keys() as index (index)}
        <Card>
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between gap-2 animate-pulse">
              <div class="h-3 w-10 rounded bg-muted/40"></div>
              <div class="h-3 w-14 rounded bg-muted/40"></div>
            </div>
            <div class="flex items-start justify-between gap-2 animate-pulse">
              <div class="h-5 w-2/3 rounded bg-muted/40"></div>
              <div class="h-4 w-4 rounded bg-muted/40"></div>
            </div>
            <div class="flex flex-wrap items-center gap-1.5 mt-1 animate-pulse">
              <div class="h-5 w-14 rounded-full bg-muted/40"></div>
              <div class="h-5 w-14 rounded-full bg-muted/40"></div>
              <div class="h-5 w-10 rounded-full bg-muted/40"></div>
            </div>
          </CardHeader>
          <CardContent class="pb-3 pt-0">
            <div class="space-y-1 animate-pulse">
              <div class="h-3 w-full rounded bg-muted/40"></div>
              <div class="h-3 w-3/4 rounded bg-muted/40"></div>
            </div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {:else}
    <div class="relative min-h-0 flex-1">
      <div class="space-y-3 overflow-y-auto h-full pt-1 pl-1 pr-1 pb-4 -mt-1 -ml-1 -mr-1">
        {#each filteredTickets as ticket (ticket.id)}
          <TicketCard {ticket} {userRole} {agentNames} />
        {/each}
      </div>
      <div class="pointer-events-none absolute left-0 right-3 bottom-0 h-8 bg-linear-to-t from-background to-transparent"></div>
    </div>
  {/if}
</div>

<style>
  @keyframes skeleton-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .skeleton-fade-in {
    opacity: 0;
    animation: skeleton-fade-in 150ms ease-in forwards;
    animation-delay: 100ms;
  }
</style>