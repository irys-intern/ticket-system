<title>Open Tickets</title>
<script lang="ts">
  import { onMount } from 'svelte';
  import type { Ticket } from '../../../types/index.ts';
  import { resolve } from '$app/paths';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Label } from '$lib/components/ui/label';
  import BackLink from '$lib/components/BackLink.svelte';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';

  const severities = ['all', 'low', 'medium', 'high', 'critical'];
  const PRIORITY_RANK: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };
  let severityFilter = $state('all');
  let searchQuery = $state('');
  let sortBy = $state('priority');
  let errors: string[] = $state([]);
  let tickets: Ticket[] = $state([]);
  let filteredTickets: Ticket[] = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    const result = tickets.filter((t: Ticket) => {
      if (severityFilter !== 'all' && t.priority !== severityFilter) return false;
      if (!q) return true;
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    });
    if (sortBy === 'oldest') return [...result].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (sortBy === 'newest') return [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return [...result].sort((a, b) => (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0));
  });

  onMount(async () => {
    const response = await fetch(PUBLIC_BACKEND_URL+'/tickets/open', {credentials: 'include'});
    const result = await response.json();
    if (!response.ok) {
      errors = result.errors ?? [result.message ?? 'Unable to fetch tickets'];
      return;
    }
    tickets = result.tickets ?? [];
  });

  const priorityVariant = (p: string) =>
    p === 'critical' ? 'destructive'
    : p === 'high' ? 'default'
    : 'secondary';
</script>

<div class="space-y-4">
  <div>
    <BackLink href={resolve('/')} />
  </div>

  <div class="flex flex-wrap items-center justify-between gap-3">
    <h1 class="text-2xl font-bold tracking-tight">Open Tickets</h1>
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
      <Label for="severity-filter" class="text-sm">Priority</Label>
      <select id="severity-filter" bind:value={severityFilter}
        class="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring">
        {#each severities as severity (severity)}
          <option value={severity}>{severity}</option>
        {/each}
      </select>
      <Label for="sort-by" class="text-sm">Sort</Label>
      <select id="sort-by" bind:value={sortBy}
        class="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring">
        <option value="priority">Priority</option>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
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

  {#if filteredTickets.length === 0 && !errors.length}
    <p class="text-muted-foreground text-sm">No open tickets found.</p>
  {/if}

  <div class="space-y-3">
    {#each filteredTickets as ticket (ticket.id)}
      <Card>
        <CardHeader class="pb-2">
          <div class="flex items-start justify-between gap-2">
            <CardTitle class="text-base">{ticket.title}</CardTitle>
            <div class="flex gap-1.5 shrink-0">
              <Badge variant={priorityVariant(ticket.priority)}>{ticket.priority}</Badge>
              <Badge variant="outline">{ticket.category.replace(/_/g, ' ')}</Badge>
            </div>
          </div>
        </CardHeader>
        {#if ticket.description}
          <CardContent class="pb-3 pt-0">
            <p class="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
          </CardContent>
        {/if}
        <CardContent class="pt-0">
          <Button size="sm" onclick={() => (window.location.href = `/tickets/${ticket.id}`)}>
            Go to ticket <ArrowRightIcon />
          </Button>
        </CardContent>
      </Card>
    {/each}
  </div>
</div>
