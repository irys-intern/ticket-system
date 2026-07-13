<script lang="ts">
  import { resolve } from '$app/paths';
  import BackLink from '$lib/components/BackLink.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '$lib/components/ui/table';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
  import TicketIcon from 'phosphor-svelte/lib/TicketIcon';
  import type { AuditEvent } from '../../../types/index.ts';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const selectClass =
    'h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring';

  let query = $state('');
  let actionFilter = $state('all');
  let events = $derived(data.events);
  let users = $derived(data.users);

  let actionOptions = $derived([...new Set(events.map((e) => e.action))].sort());

  let filtered = $derived(
    events.filter((e: AuditEvent) => {
      if (actionFilter !== 'all' && e.action !== actionFilter) return false;
      const target = typeof e.target === 'object' ? JSON.stringify(e.target) : String(e.target);
      const s = `${getUserString(e.userId)} ${e.action} ${target} ${e.ticketId}`.toLowerCase();
      return s.includes(query.trim().toLowerCase());
    })
  );

  function getUserString(userId: string) {
    const user = users.find((u) => u.id === userId);
    return user ? `${user.name} (${user.id})` : `User ${userId}`;
  }
</script>

<title>Audit Log</title>

<div class="space-y-4">
  <div>
    <BackLink href={resolve('/')} />
  </div>

  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <div class="flex items-center gap-2.5">
        <h1 class="text-2xl font-bold tracking-tight">Audit Log</h1>
        <Badge variant="secondary">{filtered.length} of {events.length} events</Badge>
      </div>
      <p class="text-sm text-muted-foreground">Review a history of system and account actions.</p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative">
        <MagnifyingGlassIcon
          class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
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

  <div class="overflow-hidden rounded-lg border border-input">
    <div class="max-h-[60vh] overflow-y-auto">
      <Table class="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead class="w-16">ID</TableHead>
            <TableHead class="w-20">Ticket</TableHead>
            <TableHead>User</TableHead>
            <TableHead>When</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#if !filtered || filtered.length === 0}
            <TableRow>
              <TableCell colspan={5} class="py-6 text-center text-muted-foreground"
                >No audit entries found.</TableCell
              >
            </TableRow>
          {:else}
            {#each filtered as e (e)}
              <TableRow>
                <TableCell class="text-sm text-muted-foreground">#{e.id}</TableCell>
                <TableCell class="text-sm">
                  <a
                    href={resolve(`/tickets/${e.ticketId}`)}
                    class="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <TicketIcon class="size-3.5" /> #{e.ticketId}
                  </a>
                </TableCell>
                <TableCell class="truncate text-sm font-medium" title={getUserString(e.userId)}
                  >{getUserString(e.userId)}</TableCell
                >
                <TableCell class="text-sm whitespace-nowrap text-muted-foreground"
                  >{new Date(e.createdAt).toLocaleString()}</TableCell
                >
                <TableCell class="text-sm"><Badge variant="outline">{e.action}</Badge></TableCell>
              </TableRow>
            {/each}
          {/if}
        </TableBody>
      </Table>
    </div>
  </div>
</div>
