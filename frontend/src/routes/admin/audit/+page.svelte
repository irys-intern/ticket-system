<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import type { AuditEvent, User } from '../../../types/index.ts';
  import { Input } from '$lib/components/ui/input';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';

  let query = $state('');
  let events: AuditEvent[] = $state([]);
  let users: User[] = $state([]);

  let filtered = $derived(events.filter((e: AuditEvent) => {
    const target = typeof e.target === 'object' ? JSON.stringify(e.target) : String(e.target);
    const s = `${getUserString(e.userId)} ${e.action} ${target}`.toLowerCase();
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
    <a href={resolve('/')} class="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">&larr; Return home</a>
  </div>

  <div class="flex items-center justify-between gap-4 flex-wrap">
    <h1 class="text-2xl font-bold tracking-tight">Audit Log</h1>
    <Input
      type="search"
      bind:value={query}
      placeholder="Search user, action, ticket…"
      class="max-w-xs"
    />
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
                <TableCell class="text-sm">{getUserString(e.userId)}</TableCell>
                <TableCell class="text-sm">{e.action}</TableCell>
                <TableCell class="text-sm">
                  <a href={resolve(`/tickets/${e.ticketId}`)} class="underline underline-offset-4 hover:text-foreground text-muted-foreground">
                    #{e.ticketId}
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
