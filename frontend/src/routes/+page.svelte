<title>Homepage</title>
<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Separator } from '$lib/components/ui/separator';
  import StatCard from '$lib/components/StatCard.svelte';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';

  import TicketIcon from 'phosphor-svelte/lib/TicketIcon';
  import TrayIcon from 'phosphor-svelte/lib/TrayIcon';
  import UsersIcon from 'phosphor-svelte/lib/UsersIcon';
  import CircleDashedIcon from 'phosphor-svelte/lib/CircleDashedIcon';
  import ArrowsClockwiseIcon from 'phosphor-svelte/lib/ArrowsClockwiseIcon';
  import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircleIcon';
  import ArchiveIcon from 'phosphor-svelte/lib/ArchiveIcon';
  import UserSwitchIcon from 'phosphor-svelte/lib/UserSwitchIcon';
  import BookOpenIcon from 'phosphor-svelte/lib/BookOpenIcon';
  import ClipboardTextIcon from 'phosphor-svelte/lib/ClipboardTextIcon';
  import ChartBarIcon from 'phosphor-svelte/lib/ChartBarIcon';
  import PlusCircleIcon from 'phosphor-svelte/lib/PlusCircleIcon';
  import SignInIcon from 'phosphor-svelte/lib/SignInIcon';
  import UserPlusIcon from 'phosphor-svelte/lib/UserPlusIcon';

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
  let loading = $state(true);

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
    loading = false;
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p class="text-muted-foreground text-sm">Welcome back, {userName}</p>
    </div>
    <div class="flex items-center gap-3">
      <Badge variant="secondary" class="capitalize">{userRole}</Badge>
      {#if userRole !== 'guest'}
        <Button href={resolve('/auth/logout')} variant="outline" size="sm">Logout</Button>
      {/if}
    </div>
  </div>

  <Separator />

  {#if loading}
    <div class="grid gap-4 sm:grid-cols-3">
      {#each Array(3).keys() as index (index)}
        <Card><CardContent class="h-16 animate-pulse rounded-md bg-muted/40"></CardContent></Card>
      {/each}
    </div>

  {:else if userRole === 'admin'}
    <div class="grid gap-4 sm:grid-cols-3">
      <StatCard icon={TicketIcon} label="Total Tickets" value={adminTotal} />
      <StatCard icon={TrayIcon} label="Open (Unassigned)" value={adminOpen} />
      <StatCard icon={UsersIcon} label="Users" value={adminUsers} />
    </div>
    <Card>
      <CardHeader><CardTitle>Admin Tools</CardTitle></CardHeader>
      <CardContent class="flex flex-wrap gap-2">
        <Button href="/admin/users"><UsersIcon /> Manage Users</Button>
        <Button href="/tickets" variant="secondary"><UserSwitchIcon /> Manage Assignments</Button>
        <Button href="/training" variant="secondary"><BookOpenIcon /> Manage Training Materials</Button>
        <Button href="/admin/audit" variant="outline"><ClipboardTextIcon /> View Audit Log</Button>
        <Button href="/admin/stats" variant="outline"><ChartBarIcon /> View Statistics</Button>
      </CardContent>
    </Card>

  {:else if userRole === 'agent'}
    <div class="grid gap-4 sm:grid-cols-2">
      <StatCard icon={TicketIcon} label="Tickets assigned to you" value={assignedAgentTickets.length} />
    </div>
    <Card>
      <CardHeader><CardTitle>Agent Tools</CardTitle></CardHeader>
      <CardContent class="flex flex-wrap gap-2">
        <Button href="/tickets"><TicketIcon /> View My Tickets</Button>
        <Button href="/tickets/open" variant="secondary"><TrayIcon /> View Open Tickets</Button>
        <Button href="/training" variant="secondary"><BookOpenIcon /> View Training Materials</Button>
      </CardContent>
    </Card>

  {:else if userRole === 'user'}
    <div class="grid gap-4 sm:grid-cols-2">
      <StatCard
        icon={CircleDashedIcon}
        label="Open Tickets"
        value={openTicketsUser.length}
        tooltip="A ticket that has been submitted and is waiting to be picked up by an agent."
      />
      <StatCard
        icon={ArrowsClockwiseIcon}
        label="In Progress Tickets"
        value={progressTicketsUser.length}
        tooltip="A ticket that is currently being worked on by an agent or awaiting your interaction."
      />
      <StatCard
        icon={CheckCircleIcon}
        label="Resolved Tickets"
        value={resolvedTicketsUser.length}
        tooltip="A ticket that has been addressed and is awaiting your confirmation or closure."
      />
      <StatCard
        icon={ArchiveIcon}
        label="Closed Tickets"
        value={closedTicketsUser.length}
        tooltip="A ticket that has been completed and closed after resolution."
      />
    </div>
    <Card>
      <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
      <CardContent class="flex flex-wrap gap-2">
        <Button href="/create_ticket"><PlusCircleIcon /> Create New Ticket</Button>
        <Button href="/tickets" variant="secondary"><TicketIcon /> View My Tickets</Button>
      </CardContent>
    </Card>

  {:else}
    <Card>
      <CardContent class="pt-6">
        <p class="text-muted-foreground mb-4">You have limited access. Please log in or register to create and manage tickets.</p>
        <div class="flex gap-2">
          <Button href="/auth/login"><SignInIcon /> Login</Button>
          <Button href="/auth/register" variant="outline"><UserPlusIcon /> Register</Button>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
