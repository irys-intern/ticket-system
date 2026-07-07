<title>Audit Log</title>
<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import type { AuditEvent, User } from '../../../types/index.ts';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import { Label } from '$lib/components/ui/label';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import BackLink from '$lib/components/BackLink.svelte';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
  import TicketIcon from 'phosphor-svelte/lib/TicketIcon';

  const selectClass =
    'h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring';

  let query = $state('');
  let actionFilter = $state('all');
  let events: AuditEvent[] = $state([]);
  let users: User[] = $state([]);

  let actionOptions = $derived([...new Set(events.map((e) => e.action))].sort());

  let filtered = $derived(events.filter((e: AuditEvent) => {
    if (actionFilter !== 'all' && e.action !== actionFilter) return false;
    const target = typeof e.target === 'object' ? JSON.stringify(e.target) : String(e.target);
    const s = `${getUserString(e.userId)} ${e.action} ${target} ${e.ticketId}`.toLowerCase();
    return s.includes(query.trim().toLowerCase());
  }));

  function getUserString(userId: string) {
    const user = users.find((u) => u.id === userId);
    return user ? `${user.name} (${user.id})` : `User ${userId}`;
  }

  onMount(async () => {
    const res = await fetch(PUBLIC_BACKEND_URL+window.location.pathname, {credentials: 'include'});
    const resp = await res.json();
    events = resp.events.sort((a: { id: any; }, b: { id: any; }) => Number(b.id) - Number(a.id));
    users = resp.users;
  });
</script>

<div class="space-y-4">
  <div>
    <BackLink href={resolve('/')} />
  </div>

  <div class="flex items-center justify-between gap-4 flex-wrap">
    <div class="flex items-center gap-2.5">
      <h1 class="text-2xl font-bold tracking-tight">Audit Log</h1>
      <Badge variant="secondary">{filtered.length} of {events.length} events</Badge>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative">
        <MagnifyingGlassIcon class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          bind:value={query}
          placeholder="Search user, action, ticket…"
          class="max-w-xs pl-8"
        />
      </div>
      <Label for="action-filter" class="text-sm">Action</Label>
      <select id="action-filter" bind:value={actionFilter} class="{selectClass} max-w-44">
        <option value="all">All</option>
        {#each actionOptions as action (action)}
          <option value={action}>{action}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="rounded-lg border overflow-hidden">
    <div class="max-h-[60vh] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Ticket</TableHead>
            <TableHead class="text-right">ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#if !filtered || filtered.length === 0}
            <TableRow>
              <TableCell colspan={5} class="text-center text-muted-foreground py-6">No audit entries found.</TableCell>
            </TableRow>
          {:else}
            {#each filtered as e (e)}
              <TableRow>
                <TableCell class="text-sm text-muted-foreground whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</TableCell>
                <TableCell class="text-sm font-medium">{getUserString(e.userId)}</TableCell>
                <TableCell class="text-sm"><Badge variant="outline">{e.action}</Badge></TableCell>
                <TableCell class="text-sm">
                  <a href={resolve(`/tickets/${e.ticketId}`)} class="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                    <TicketIcon class="size-3.5" /> #{e.ticketId}
                  </a>
                </TableCell>
                <TableCell class="text-sm text-right text-muted-foreground">#{e.id}</TableCell>
              </TableRow>
            {/each}
          {/if}
        </TableBody>
      </Table>
    </div>
  </div>
</div>
