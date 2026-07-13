<script lang="ts">
  import type { Ticket, User } from '../../../types/index.ts';
  import AgentStatCards from './AgentStatCards.svelte';
  import StatusDonutChart from './StatusDonutChart.svelte';
  import TicketDistributionChart from './TicketDistributionChart.svelte';

  let {
    tickets,
    agents,
    loading = false,
  }: { tickets: Ticket[]; agents: User[]; loading?: boolean } = $props();

  const selectClass =
    'h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring disabled:opacity-50';

  let selectedAgentId = $state('');

  $effect(() => {
    if (!loading && agents.length > 0 && !selectedAgentId) {
      selectedAgentId = agents[0].id;
    }
  });

  const agentTickets = $derived(tickets.filter((t) => t.assignedTo === selectedAgentId));
</script>

<div class="space-y-4">
  <div class="flex flex-wrap items-center gap-3">
    <h2 class="text-xl font-semibold tracking-tight">Agent Performance</h2>
    <select
      bind:value={selectedAgentId}
      disabled={loading || agents.length === 0}
      class="{selectClass} min-w-44"
    >
      {#if loading}
        <option value="">Loading…</option>
      {:else if agents.length === 0}
        <option value="">No agents found</option>
      {:else}
        {#each agents as agent (agent.id)}
          <option value={agent.id}>{agent.name} ({agent.role})</option>
        {/each}
      {/if}
    </select>
  </div>

  <AgentStatCards {agentTickets} {loading} />
  <TicketDistributionChart {agentTickets} {loading} />
  <StatusDonutChart {agentTickets} {loading} />
</div>
