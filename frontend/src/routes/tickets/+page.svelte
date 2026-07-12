<script lang="ts">
  import { resolve } from '$app/paths';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import BackLink from '$lib/components/BackLink.svelte';
  import TicketCard from '$lib/components/TicketCard.svelte';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
  import { Label } from '$lib/components/ui/label';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
  import { onMount } from 'svelte';
  import type { Ticket } from '../../types/index.ts';

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
    if (sortBy === 'oldest')
      return [...result].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    if (sortBy === 'priority')
      return [...result].sort(
        (a, b) => (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0)
      );
    if (sortBy === 'agent')
      return [...result].sort((a, b) =>
        (agentNames[a.assignedTo ?? ''] ?? '').localeCompare(agentNames[b.assignedTo ?? ''] ?? '')
      );
    return [...result].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  onMount(async () => {
    const response = await fetch(PUBLIC_BACKEND_URL + '/tickets', { credentials: 'include' });
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
      const usersResponse = await fetch(PUBLIC_BACKEND_URL + '/admin/users', {
        credentials: 'include',
      });
      const usersResult = await usersResponse.json();
      if (usersResponse.ok) {
        agentNames = Object.fromEntries(
          (usersResult.users ?? []).map((u: { id: string; name: string }) => [u.id, u.name])
        );
      }
    }
    isLoading = false;
  });
</script>

<title>All Tickets</title>

<div class="flex min-h-0 flex-1 flex-col space-y-4">
  <div class="shrink-0">
    <BackLink href={resolve('/')} />
  </div>

  <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">My Tickets</h1>
      <p class="text-sm text-muted-foreground">View, search, and filter your submitted tickets.</p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative">
        <MagnifyingGlassIcon
          class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          bind:value={searchQuery}
          placeholder="Search tickets…"
          class="h-8 w-48 rounded-lg border border-input bg-transparent py-1 pr-2.5 pl-7 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        />
      </div>
      <Label for="status-filter" class="text-sm">Status</Label>
      <select
        id="status-filter"
        bind:value={statusFilter}
        class="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {#each statuses as status (status)}
          <option value={status}>{status.replace(/_/g, ' ')}</option>
        {/each}
      </select>
      <Label for="sort-by" class="text-sm">Sort</Label>
      <select
        id="sort-by"
        bind:value={sortBy}
        class="h-8 w-28 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
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
        <ul class="list-inside list-disc space-y-1">
          {#each errors as error (error)}<li>{error}</li>{/each}
        </ul>
      </AlertDescription>
    </Alert>
  {/if}

  {#if filteredTickets.length === 0 && !errors.length && !isLoading}
    <p class="shrink-0 text-sm text-muted-foreground">No tickets found.</p>
  {/if}

  {#if isLoading}
    <div
      class="skeleton-fade-in -mt-1 -mr-1 -ml-1 min-h-0 flex-1 space-y-3 overflow-y-auto pt-1 pr-1 pb-4 pl-1"
    >
      {#each Array(3).keys() as index (index)}
        <Card>
          <CardHeader class="pb-2">
            <div class="flex animate-pulse items-center justify-between gap-2">
              <div class="h-3 w-10 rounded bg-muted/40"></div>
              <div class="h-3 w-14 rounded bg-muted/40"></div>
            </div>
            <div class="flex animate-pulse items-start justify-between gap-2">
              <div class="h-5 w-2/3 rounded bg-muted/40"></div>
              <div class="h-4 w-4 rounded bg-muted/40"></div>
            </div>
            <div class="mt-1 flex animate-pulse flex-wrap items-center gap-1.5">
              <div class="h-5 w-14 rounded-full bg-muted/40"></div>
              <div class="h-5 w-14 rounded-full bg-muted/40"></div>
              <div class="h-5 w-10 rounded-full bg-muted/40"></div>
            </div>
          </CardHeader>
          <CardContent class="pt-0 pb-3">
            <div class="animate-pulse space-y-1">
              <div class="h-3 w-full rounded bg-muted/40"></div>
              <div class="h-3 w-3/4 rounded bg-muted/40"></div>
            </div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {:else}
    <div class="relative min-h-0 flex-1">
      <div class="-mt-1 -mr-1 -ml-1 h-full space-y-3 overflow-y-auto pt-1 pr-1 pb-4 pl-1">
        {#each filteredTickets as ticket (ticket.id)}
          <TicketCard {ticket} {userRole} {agentNames} />
        {/each}
      </div>
      <div
        class="pointer-events-none absolute right-3 bottom-0 left-0 h-8 bg-linear-to-t from-background to-transparent"
      ></div>
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
