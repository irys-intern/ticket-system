<title>Admin Stats</title>

<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import BackLink from '$lib/components/BackLink.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import TicketTimelineChart from '$lib/components/stats/TicketTimelineChart.svelte';
  import AgentPerformancePanel from '$lib/components/stats/AgentPerformancePanel.svelte';
  import AgentComparisonTable from '$lib/components/stats/AgentComparisonTable.svelte';
  import TicketVolumeChart from '$lib/components/stats/TicketVolumeChart.svelte';
  import ResolutionTimeChart from '$lib/components/stats/ResolutionTimeChart.svelte';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import TicketIcon from 'phosphor-svelte/lib/TicketIcon';
  import TrayIcon from 'phosphor-svelte/lib/TrayIcon';
  import ClockIcon from 'phosphor-svelte/lib/ClockIcon';
  import type { Ticket, User, AuditEvent } from '../../../types';

  let tickets = $state<Ticket[]>([]);
  let users = $state<User[]>([]);
  let auditEvents = $state<AuditEvent[]>([]);
  let loading = $state(true);
  let errors = $state<string[]>([]);

  const agents = $derived(users.filter((u) => u.role === 'agent'));

  const avgTimeToAssignment = $derived.by((): string => {
    const assignments = auditEvents.filter((e) => e.action === 'ticket assigned');
    const earliest = new Map<string, number>();
    for (const e of assignments) {
      const key = String(e.ticketId);
      const t = new Date(e.createdAt).getTime();
      if (!earliest.has(key) || t < earliest.get(key)!) earliest.set(key, t);
    }
    const deltas: number[] = [];
    for (const [ticketId, assignedAt] of earliest) {
      const ticket = tickets.find((t) => String(t.id) === ticketId);
      if (!ticket) continue;
      const delta = assignedAt - new Date(ticket.createdAt).getTime();
      if (delta >= 0) deltas.push(delta);
    }
    if (deltas.length === 0) return '—';
    const avgMs = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    if (avgMs < 3_600_000) return `${Math.round(avgMs / 60_000)}m`;
    if (avgMs < 86_400_000) return `${(avgMs / 3_600_000).toFixed(1)}h`;
    return `${(avgMs / 86_400_000).toFixed(1)}d`;
  });

  onMount(async () => {
    const [ticketsRes, usersRes, auditRes] = await Promise.all([
      fetch(PUBLIC_BACKEND_URL + '/tickets', { credentials: 'include' }),
      fetch(PUBLIC_BACKEND_URL + '/admin/users', { credentials: 'include' }),
      fetch(PUBLIC_BACKEND_URL + '/admin/audit', { credentials: 'include' }),
    ]);

    const ticketsData = await ticketsRes.json();
    const usersData = await usersRes.json();

    if (!ticketsRes.ok) {
      errors = ticketsData.errors ?? ['Failed to load tickets'];
      loading = false;
      return;
    }
    if (!usersRes.ok) {
      errors = usersData.errors ?? ['Failed to load users'];
      loading = false;
      return;
    }

    tickets = ticketsData.tickets;
    users = usersData.users;
    if (auditRes.ok) {
      const auditData = await auditRes.json();
      auditEvents = auditData.events ?? [];
    }
    loading = false;
  });
</script>

<div class="space-y-4">
  <div>
    <BackLink href={resolve('/')} />
  </div>

  <div>
    <h1 class="text-2xl font-bold tracking-tight">Admin Stats</h1>
    <p class="text-sm text-muted-foreground">Ticket volume and agent performance at a glance.</p>
  </div>

  {#if errors.length}
    <Alert variant="destructive">
      <AlertDescription>
        {#each errors as e}<p>{e}</p>{/each}
      </AlertDescription>
    </Alert>
  {/if}

  <!-- ── Overall stats ────────────────────────────────────────────── -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
    <StatCard
      icon={TicketIcon}
      label="Total Tickets"
      value={tickets.length}
      tooltip="All tickets ever created, regardless of status."
      loading={loading}
    />
    <StatCard
      icon={TrayIcon}
      label="Open & Unassigned"
      value={tickets.filter((t) => t.status === 'open' && !t.assignedTo).length}
      tooltip="Tickets still in the 'open' status that have not been claimed or assigned to an agent."
      loading={loading}
    />
    <StatCard
      icon={ClockIcon}
      label="Avg Time to Assignment"
      value={avgTimeToAssignment}
      tooltip="Average time between a ticket being created and an agent first being assigned, based on the audit log."
      loading={loading}
    />
  </div>

  <!-- ── Ticket Timeline ───────────────────────────────────────────── -->
  <TicketTimelineChart {tickets} {loading} />

  <!-- ── Agent Performance ─────────────────────────────────────────── -->
  <AgentPerformancePanel {tickets} {agents} {loading} />

  <!-- ── Agent Comparison ──────────────────────────────────────────── -->
  <AgentComparisonTable {agents} {tickets} {loading} />

  <!-- ── Ticket Volume Over Time ────────────────────────────────────── -->
  <TicketVolumeChart {tickets} {loading} />

  <!-- ── Resolution Time Over Time ─────────────────────────────────── -->
  <ResolutionTimeChart {tickets} {agents} {loading} />
</div>
