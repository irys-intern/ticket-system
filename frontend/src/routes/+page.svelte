<title>Homepage</title>
<script lang="ts">
  import { resolve } from '$app/paths';
  import { Badge } from '$lib/components/ui/badge';
  import StatCard from '$lib/components/StatCard.svelte';
  import ToolLinkCard from '$lib/components/ToolLinkCard.svelte';
  import type { PageData } from './$types';

  import TicketIcon from 'phosphor-svelte/lib/TicketIcon';
  import WarningIcon from 'phosphor-svelte/lib/WarningIcon';
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

<div class="space-y-5">
  <div class="flex items-center justify-between rounded-xl bg-linear-to-br from-primary/10 to-primary/0 px-5 py-4 ring-1 ring-primary/10">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p class="text-muted-foreground text-sm">Welcome back, {data.userName}</p>
    </div>
    <div class="flex items-center gap-3">
      <Badge variant="secondary" class="capitalize">{data.userRole}</Badge>
    </div>
  </div>

  {#if data.userRole === 'admin'}
    {#await stats}
      <div class="grid gap-3 sm:grid-cols-3">
        <StatCard icon={TicketIcon} label="Total Tickets" loading />
        <StatCard icon={TrayIcon} label="Open (Unassigned)" loading />
        <StatCard icon={UsersIcon} label="Users" loading />
      </div>
    {:then stats}
      <div class="grid gap-3 sm:grid-cols-3">
        <StatCard icon={TicketIcon} label="Total Tickets" value={stats.adminTotal} />
        <StatCard icon={TrayIcon} label="Open (Unassigned)" value={stats.adminOpen} />
        <StatCard icon={UsersIcon} label="Users" value={stats.adminUsers} />
      </div>
    {/await}
    <div class="space-y-2.5">
      <h2 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Admin Tools</h2>
      <div class="flex flex-col gap-3">
        <ToolLinkCard
          icon={UsersIcon}
          label="Manage Users"
          description="Create, edit, and manage user accounts and roles."
          href="/admin/users"
          color="#3b82f6"
        />
        <ToolLinkCard
          icon={UserSwitchIcon}
          label="Manage Assignments"
          description="View and reassign tickets across agents."
          href="/tickets"
          color="#8b5cf6"
        />
        <ToolLinkCard
          icon={BookOpenIcon}
          label="Manage Training Materials"
          description="Create and edit training content for agents."
          href="/training"
          color="#10b981"
        />
        <ToolLinkCard
          icon={ClipboardTextIcon}
          label="View Audit Log"
          description="Review a history of system and account actions."
          href="/admin/audit"
          color="#f59e0b"
        />
        <ToolLinkCard
          icon={ChartBarIcon}
          label="View Statistics"
          description="See ticket volume, resolution trends, and metrics."
          href="/admin/stats"
          color="#ec4899"
        />
        <ToolLinkCard
          icon={GearSixIcon}
          label="App Settings"
          description="Tune site options quickly."
          href="/admin/settings"
          color="#64748b"
        />
      </div>
    </div>

  {:else if data.userRole === 'agent'}
    {#await stats}
      <div class="grid gap-3 sm:grid-cols-2">
        <StatCard icon={TicketIcon} label="Tickets assigned to you" loading />
      </div>
    {:then stats}
      <div class="grid gap-3 sm:grid-cols-2">
        <StatCard icon={TicketIcon} label="Tickets assigned to you" value={stats.assignedAgentTickets.length} />
      </div>
    {/await}
    <div class="space-y-2.5">
      <h2 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Agent Tools</h2>
      <div class="flex flex-col gap-3">
        <ToolLinkCard
          icon={TicketIcon}
          label="View My Tickets"
          description="See the status and history of tickets assigned to you."
          href="/tickets"
          color="#3b82f6"
        />
        <ToolLinkCard
          icon={TrayIcon}
          label="View Open Tickets"
          description="Browse unassigned tickets available to pick up."
          href="/tickets/open"
          color="#f59e0b"
        />
        <ToolLinkCard
          icon={BookOpenIcon}
          label="View Training Materials"
          description="Access reference guides and training content."
          href="/training"
          color="#10b981"
        />
      </div>
    </div>

  {:else if data.userRole === 'user'}
    {#await stats then s}
      {@const waitingTickets = (s.progressTicketsUser as { id: number; title: string; status: string }[]).filter(
        (t) => t.status === 'waiting_for_response'
      )}
      {#if waitingTickets.length > 0}
        <div class="flex gap-2.5 rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm">
          <WarningIcon class="size-4 shrink-0 translate-y-0.5 text-yellow-600 dark:text-yellow-400" />
          <div class="min-w-0">
            <p class="font-medium text-yellow-700 dark:text-yellow-400">
              {waitingTickets.length === 1
                ? 'A ticket is waiting for your response.'
                : `${waitingTickets.length} tickets are waiting for your response.`}
            </p>
            <p class="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-muted-foreground">
              {#each waitingTickets as ticket, i (ticket.id)}
                <a
                  href={resolve(`/tickets/${ticket.id}`)}
                  class="underline underline-offset-2 hover:text-foreground"
                >
                  #{ticket.id} {ticket.title}
                </a>{#if i < waitingTickets.length - 1}<span class="text-muted-foreground/50">&middot;</span>{/if}
              {/each}
            </p>
          </div>
        </div>
      {/if}
    {/await}
    {#await stats}
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
    <div class="space-y-2.5">
      <h2 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Actions</h2>
      <div class="flex flex-col gap-3">
        <ToolLinkCard
          icon={PlusCircleIcon}
          label="Create New Ticket"
          description="Submit a new issue or request for support."
          href="/create_ticket"
          color="#10b981"
        />
        <ToolLinkCard
          icon={TicketIcon}
          label="View My Tickets"
          description="See the status and history of tickets you've submitted."
          href="/tickets"
          color="#3b82f6"
        />
      </div>
    </div>

  {:else}
    <div class="space-y-2.5">
      <h2 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Get Started</h2>
      <div class="flex flex-col gap-3">
        <ToolLinkCard
          icon={SignInIcon}
          label="Login"
          description="Access your account to create and manage tickets."
          href="/auth/login"
          color="#3b82f6"
        />
        <ToolLinkCard
          icon={UserPlusIcon}
          label="Register"
          description="Create a new account to get started."
          href="/auth/register"
          color="#10b981"
        />
      </div>
    </div>
  {/if}
</div>
