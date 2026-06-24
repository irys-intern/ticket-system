<title>All Tickets</title>
<script lang="ts">
  import { onMount } from 'svelte';
  import type { Ticket } from '../../types/index.ts';
  import { resolve } from '$app/paths';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Label } from '$lib/components/ui/label';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';

  const statuses = ['all', 'open', 'in_progress', 'waiting_for_response', 'closed'];
  let statusFilter = $state('all');
  let errors: string[] = $state([]);
  let tickets: Ticket[] = $state([]);
  let isLoading = $state(true);
  let filteredTickets: Ticket[] = $derived(
    statusFilter === 'all' ? tickets : tickets.filter((t: Ticket) => t.status === statusFilter)
  );

  onMount(async () => {
    const response = await fetch(PUBLIC_BACKEND_URL+'/tickets', {credentials: 'include'});
    const result = await response.json();
    if (!response.ok) {
      errors = result.errors ?? [result.message ?? 'Unable to fetch tickets'];
      isLoading = false;
      return;
    }
    tickets = result.tickets ?? [];
    if (result.userRole === 'agent') {
      statusFilter = 'in_progress';
    }
    isLoading = false;
  });

  const statusVariant = (s: string) =>
    s === 'open' ? 'secondary'
    : s === 'closed' ? 'outline'
    : 'default';
</script>

<div class="space-y-4">
  <div>
    <a href={resolve('/')} class="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">&larr; Return home</a>
  </div>

  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold tracking-tight">My Tickets</h1>
    <div class="flex items-center gap-2">
      <Label for="status-filter" class="text-sm">Status</Label>
      <select id="status-filter" bind:value={statusFilter}
        class="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring">
        {#each statuses as status (status)}
          <option value={status}>{status.replace(/_/g, ' ')}</option>
        {/each}
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
      <Card>
        <CardHeader class="pb-2">
          <div class="flex items-start justify-between gap-2">
            <CardTitle class="text-base">{ticket.title}</CardTitle>
            <div class="flex gap-1.5 shrink-0">
              <Badge variant={statusVariant(ticket.status)}>{ticket.status.replace(/_/g, ' ')}</Badge>
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
          <Button size="sm" class="cursor-pointer" onclick={() => (window.location.href = `/tickets/${ticket.id}`)}>
            Go to ticket
          </Button>
        </CardContent>
      </Card>
    {/each}
    </div>
  {/if}
</div>