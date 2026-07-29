<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page as pageStore } from '$app/state';
  import BackLink from '$lib/components/BackLink.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
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
  import { untrack } from 'svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const selectClass =
    'h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring';

  // Kept in sync with backend/src/utils/validators.ts's AUDIT_ACTIONS -- the two
  // apps don't share code, so this is the frontend's copy of that fixed action set.
  const ACTION_OPTIONS = [
    'ticket created',
    'ticket updated',
    'ticket assigned',
    'ticket reassigned',
    'status changed',
    'comment added',
  ];

  let query = $state(untrack(() => data.q));
  let actionFilter = $state(untrack(() => data.action || 'all'));
  let events = $derived(data.events);
  let users = $derived(data.users);

  function getUserString(userId: string) {
    const user = users.find((u) => u.id === userId);
    return user ? `${user.name} (${user.id})` : `User ${userId}`;
  }

  function navigate(params: { page?: number; q?: string; action?: string }) {
    const next = new URLSearchParams(pageStore.url.searchParams);
    if (params.q !== undefined) {
      if (params.q) next.set('q', params.q);
      else next.delete('q');
      next.delete('page');
    }
    if (params.action !== undefined) {
      if (params.action && params.action !== 'all') next.set('action', params.action);
      else next.delete('action');
      next.delete('page');
    }
    if (params.page !== undefined) {
      if (params.page > 1) next.set('page', String(params.page));
      else next.delete('page');
    }
    goto(`?${next}`, { keepFocus: true, noScroll: true });
  }

  let searchDebounce: ReturnType<typeof setTimeout>;
  function onSearchInput() {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => navigate({ q: query }), 300);
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
        <Badge variant="secondary">{data.total} events</Badge>
      </div>
      <p class="text-sm text-muted-foreground">Review a history of system and account actions.</p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative shrink-0">
        <MagnifyingGlassIcon
          class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          bind:value={query}
          oninput={onSearchInput}
          placeholder="Search user, action, or ticket #…"
          class="w-64 pl-8 sm:w-80"
        />
      </div>
      <Label for="action-filter" class="text-sm">Action</Label>
      <select
        id="action-filter"
        bind:value={actionFilter}
        onchange={() => navigate({ action: actionFilter })}
        class="{selectClass} max-w-44"
      >
        <option value="all">All</option>
        {#each ACTION_OPTIONS as action (action)}
          <option value={action}>{action}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="max-h-[60vh] overflow-y-auto rounded-lg">
    <div class="px-8">
      <Table class="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead class="w-16">ID</TableHead>
            <TableHead class="w-20">Ticket</TableHead>
            <TableHead>User</TableHead>
            <TableHead class="w-44">When</TableHead>
            <TableHead class="w-32 pl-4 text-left">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#if !events || events.length === 0}
            <TableRow>
              <TableCell colspan={5} class="py-6 text-center text-muted-foreground"
                >No audit entries found.</TableCell
              >
            </TableRow>
          {:else}
            {#each events as e (e.id)}
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
                <TableCell class="text-left text-sm"><Badge variant="outline">{e.action}</Badge></TableCell>
              </TableRow>
            {/each}
          {/if}
        </TableBody>
      </Table>
    </div>
  </div>

  <Pagination
    page={data.page}
    totalPages={data.totalPages}
    total={data.total}
    onPageChange={(p) => navigate({ page: p })}
  />
</div>
