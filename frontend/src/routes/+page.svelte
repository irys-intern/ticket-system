<title>Homepage</title>
<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Separator } from '$lib/components/ui/separator';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';

  let userRole = $state('guest');
  let userName = $state('Guest User');
  let openTicketsUser: unknown[] = $state([]);
  let resolvedTicketsUser: unknown[] = $state([]);
  let closedTicketsUser: unknown[] = $state([]);
  let progressTicketsUser: unknown[] = $state([]);
  let assignedAgentTickets: unknown[] = $state([]);
  let adminTotal = $state('...');
  let adminOpen = $state('...');
  let adminUsers = $state('...');

  onMount(async () => {
    const response = await fetch(PUBLIC_BACKEND_URL, {credentials: 'include'});
    const data = await response.json();
    userRole = data.userRole || 'guest';
    userName = data.userName || 'Guest User';
    openTicketsUser = data.openTicketsUser || [];
    resolvedTicketsUser = data.resolvedTicketsUser || [];
    closedTicketsUser = data.closedTicketsUser || [];
    progressTicketsUser = data.progressTicketsUser || [];
    assignedAgentTickets = data.assignedAgentTickets || [];
    adminTotal = data.adminTotal ?? 0;
    adminOpen = data.adminOpen ?? 0;
    adminUsers = data.adminUsers ?? 0;
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p class="text-muted-foreground text-sm">Welcome back, {userName}</p>
    </div>
    <div class="flex items-center gap-3">
      <Badge variant="secondary">{userRole}</Badge>
      {#if userRole !== 'guest'}
        <Button href={resolve('/auth/logout')} variant="outline" size="sm">Logout</Button>
      {/if}
    </div>
  </div>

  <Separator />

  {#if userRole === 'admin'}
    <div class="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader><CardTitle class="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle></CardHeader>
        <CardContent><p class="text-3xl font-bold">{adminTotal}</p></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle class="text-sm font-medium text-muted-foreground">Open (Unassigned)</CardTitle></CardHeader>
        <CardContent><p class="text-3xl font-bold">{adminOpen}</p></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle class="text-sm font-medium text-muted-foreground">Users</CardTitle></CardHeader>
        <CardContent><p class="text-3xl font-bold">{adminUsers}</p></CardContent>
      </Card>
    </div>
    <Card>
      <CardHeader><CardTitle>Admin Tools</CardTitle></CardHeader>
      <CardContent class="flex flex-wrap gap-2">
        <Button href="/admin/users">Manage Users</Button>
        <Button href="/tickets" variant="secondary">Manage Assignments</Button>
        <Button href="/training" variant="secondary">Manage Training Materials</Button>
        <Button href="/admin/audit" variant="outline">View Audit Log</Button>
        <Button href="/admin/stats" variant="outline">View Statistics</Button>
      </CardContent>
    </Card>

  {:else if userRole === 'agent'}
    <div class="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader><CardTitle class="text-sm font-medium text-muted-foreground">Assigned Tickets</CardTitle></CardHeader>
        <CardContent>
          <p class="text-3xl font-bold">{assignedAgentTickets.length}</p>
          <p class="text-xs text-muted-foreground mt-1">tickets assigned to you</p>
        </CardContent>
      </Card>
    </div>
    <Card>
      <CardHeader><CardTitle>Agent Tools</CardTitle></CardHeader>
      <CardContent class="flex flex-wrap gap-2">
        <Button href="/tickets">View My Tickets</Button>
        <Button href="/tickets/open" variant="secondary">View Open Tickets</Button>
        <Button href="/training" variant="secondary">View Training Materials</Button>
      </CardContent>
    </Card>

  {:else if userRole === 'user'}
    <div class="grid gap-4 sm:grid-cols-2">
      <Card class="group relative">
        <CardHeader class="relative">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            Open Tickets
            <span class="ml-1 text-xs text-muted-foreground cursor-help">?</span>
          </CardTitle>
          <div class="pointer-events-none absolute left-0 top-full z-10 mt-2 hidden w-64 rounded-md bg-slate-950 px-3 py-2 text-xs text-white shadow ring-1 ring-white/10 group-hover:block">
            A ticket that has been submitted and is waiting to be picked up by an agent.
          </div>
        </CardHeader>
        <CardContent><p class="text-3xl font-bold">{openTicketsUser.length}</p></CardContent>
      </Card>
      <Card class="group relative">
        <CardHeader class="relative">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            In Progress Tickets
            <span class="ml-1 text-xs text-muted-foreground cursor-help">?</span>
          </CardTitle>
          <div class="pointer-events-none absolute left-0 top-full z-10 mt-2 hidden w-64 rounded-md bg-slate-950 px-3 py-2 text-xs text-white shadow ring-1 ring-white/10 group-hover:block">
            A ticket that is currently being worked on by an agent or awaiting your interaction.
          </div>
        </CardHeader>
        <CardContent><p class="text-3xl font-bold">{progressTicketsUser.length}</p></CardContent>
      </Card>
      <Card class="group relative">
        <CardHeader class="relative">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            Resolved Tickets
            <span class="ml-1 text-xs text-muted-foreground cursor-help">?</span>
          </CardTitle>
          <div class="pointer-events-none absolute left-0 top-full z-10 mt-2 hidden w-64 rounded-md bg-slate-950 px-3 py-2 text-xs text-white shadow ring-1 ring-white/10 group-hover:block">
            A ticket that has been addressed and is awaiting your confirmation or closure.
          </div>
        </CardHeader>
        <CardContent><p class="text-3xl font-bold">{resolvedTicketsUser.length}</p></CardContent>
      </Card>
      <Card class="group relative">
        <CardHeader class="relative">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            Closed Tickets
            <span class="ml-1 text-xs text-muted-foreground cursor-help">?</span>
          </CardTitle>
          <div class="pointer-events-none absolute left-0 top-full z-10 mt-2 hidden w-64 rounded-md bg-slate-950 px-3 py-2 text-xs text-white shadow ring-1 ring-white/10 group-hover:block">
            A ticket that has been completed and closed after resolution.
          </div>
        </CardHeader>
        <CardContent><p class="text-3xl font-bold">{closedTicketsUser.length}</p></CardContent>
      </Card>
    </div>
    <Card>
      <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
      <CardContent class="flex flex-wrap gap-2">
        <Button href="/create_ticket">Create New Ticket</Button>
        <Button href="/tickets" variant="secondary">View My Tickets</Button>
      </CardContent>
    </Card>

  {:else}
    <Card>
      <CardContent class="pt-6">
        <p class="text-muted-foreground mb-4">You have limited access. Please log in or register to create and manage tickets.</p>
        <div class="flex gap-2">
          <Button href="/auth/login">Login</Button>
          <Button href="/auth/register" variant="outline">Register</Button>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
