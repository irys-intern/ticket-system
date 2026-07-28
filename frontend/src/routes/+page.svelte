<title>Homepage</title>
<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Separator } from '$lib/components/ui/separator';
  import StatCard from '$lib/components/StatCard.svelte';
  import ToolLinkCard from '$lib/components/ToolLinkCard.svelte';
  import type { PageData } from './$types';

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
  import GearSixIcon from 'phosphor-svelte/lib/GearSixIcon';

  let { data }: { data: PageData } = $props();

  function withMinDelay<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.all([promise, new Promise((resolve) => setTimeout(resolve, ms))]).then(([result]) => result);
  }

  let stats = $derived(withMinDelay(data.stats, 600));
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p class="text-muted-foreground text-sm">Welcome back, {data.userName}</p>
    </div>
    <div class="flex items-center gap-3">
      <Badge variant="secondary" class="capitalize">{data.userRole}</Badge>
    </div>
  </div>

  <Separator />

  {#if data.userRole === 'admin'}
    {#await stats}
      <div class="grid gap-4 sm:grid-cols-3">
        <StatCard icon={TicketIcon} label="Total Tickets" loading />
        <StatCard icon={TrayIcon} label="Open (Unassigned)" loading />
        <StatCard icon={UsersIcon} label="Users" loading />
      </div>
    {:then stats}
      <div class="grid gap-4 sm:grid-cols-3">
        <StatCard icon={TicketIcon} label="Total Tickets" value={stats.adminTotal} />
        <StatCard icon={TrayIcon} label="Open (Unassigned)" value={stats.adminOpen} />
        <StatCard icon={UsersIcon} label="Users" value={stats.adminUsers} />
      </div>
    {/await}
    <Card>
      <CardHeader><CardTitle>Admin Tools</CardTitle></CardHeader>
      <CardContent class="grid gap-3 sm:grid-cols-2">
        <ToolLinkCard
          icon={UsersIcon}
          label="Manage Users"
          description="Create, edit, and manage user accounts and roles."
          href="/admin/users"
        />
        <ToolLinkCard
          icon={UserSwitchIcon}
          label="Manage Assignments"
          description="View and reassign tickets across agents."
          href="/tickets"
        />
        <ToolLinkCard
          icon={BookOpenIcon}
          label="Manage Training Materials"
          description="Create and edit training content for agents."
          href="/training"
        />
        <ToolLinkCard
          icon={ClipboardTextIcon}
          label="View Audit Log"
          description="Review a history of system and account actions."
          href="/admin/audit"
        />
        <ToolLinkCard
          icon={ChartBarIcon}
          label="View Statistics"
          description="See ticket volume, resolution trends, and metrics."
          href="/admin/stats"
        />
        <ToolLinkCard
          icon={GearSixIcon}
          label="App Settings"
          description="Tune site options quickly."
          href="/admin/settings"
        />
      </CardContent>
    </Card>

  {:else if data.userRole === 'agent'}
    {#await stats}
      <div class="grid gap-4 sm:grid-cols-2">
        <StatCard icon={TicketIcon} label="Tickets assigned to you" loading />
      </div>
    {:then stats}
      <div class="grid gap-4 sm:grid-cols-2">
        <StatCard icon={TicketIcon} label="Tickets assigned to you" value={stats.assignedAgentTickets.length} />
      </div>
    {/await}
    <Card>
      <CardHeader><CardTitle>Agent Tools</CardTitle></CardHeader>
      <CardContent class="grid gap-3 sm:grid-cols-2">
        <ToolLinkCard
          icon={TicketIcon}
          label="View My Tickets"
          description="See the status and history of tickets assigned to you."
          href="/tickets"
        />
        <ToolLinkCard
          icon={TrayIcon}
          label="View Open Tickets"
          description="Browse unassigned tickets available to pick up."
          href="/tickets/open"
        />
        <ToolLinkCard
          icon={BookOpenIcon}
          label="View Training Materials"
          description="Access reference guides and training content."
          href="/training"
        />
      </CardContent>
    </Card>

  {:else if data.userRole === 'user'}
    {#await stats}
      <div class="grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={CircleDashedIcon}
          label="Open Tickets"
          loading
          tooltip="A ticket that has been submitted and is waiting to be picked up by an agent."
        />
        <StatCard
          icon={ArrowsClockwiseIcon}
          label="In Progress Tickets"
          loading
          tooltip="A ticket that is currently being worked on by an agent or awaiting your interaction."
        />
        <StatCard
          icon={CheckCircleIcon}
          label="Resolved Tickets"
          loading
          tooltip="A ticket that has been addressed and is awaiting your confirmation or closure."
        />
        <StatCard
          icon={ArchiveIcon}
          label="Closed Tickets"
          loading
          tooltip="A ticket that has been completed and closed after resolution."
        />
      </div>
    {:then stats}
      <div class="grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={CircleDashedIcon}
          label="Open Tickets"
          value={stats.openTicketsUser.length}
          tooltip="A ticket that has been submitted and is waiting to be picked up by an agent."
        />
        <StatCard
          icon={ArrowsClockwiseIcon}
          label="In Progress Tickets"
          value={stats.progressTicketsUser.length}
          tooltip="A ticket that is currently being worked on by an agent or awaiting your interaction."
        />
        <StatCard
          icon={CheckCircleIcon}
          label="Resolved Tickets"
          value={stats.resolvedTicketsUser.length}
          tooltip="A ticket that has been addressed and is awaiting your confirmation or closure."
        />
        <StatCard
          icon={ArchiveIcon}
          label="Closed Tickets"
          value={stats.closedTicketsUser.length}
          tooltip="A ticket that has been completed and closed after resolution."
        />
      </div>
    {/await}
    <Card>
      <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
      <CardContent class="grid gap-3 sm:grid-cols-2">
        <ToolLinkCard
          icon={PlusCircleIcon}
          label="Create New Ticket"
          description="Submit a new issue or request for support."
          href="/create_ticket"
        />
        <ToolLinkCard
          icon={TicketIcon}
          label="View My Tickets"
          description="See the status and history of tickets you've submitted."
          href="/tickets"
        />
      </CardContent>
    </Card>

  {:else}
    <Card>
      <CardHeader><CardTitle>Get Started</CardTitle></CardHeader>
      <CardContent class="grid gap-3 sm:grid-cols-2">
        <ToolLinkCard
          icon={SignInIcon}
          label="Login"
          description="Access your account to create and manage tickets."
          href="/auth/login"
        />
        <ToolLinkCard
          icon={UserPlusIcon}
          label="Register"
          description="Create a new account to get started."
          href="/auth/register"
        />
      </CardContent>
    </Card>
  {/if}
</div>
