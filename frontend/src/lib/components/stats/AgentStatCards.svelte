<script lang="ts">
  import StatCard from '$lib/components/StatCard.svelte';
  import type { Ticket } from '../../../types/index.ts';
  import { STATUS_COLORS, resolutionMs } from './statsUtils';
  import ArrowsClockwiseIcon from 'phosphor-svelte/lib/ArrowsClockwiseIcon';
  import HourglassIcon from 'phosphor-svelte/lib/HourglassIcon';
  import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircleIcon';
  import ArchiveIcon from 'phosphor-svelte/lib/ArchiveIcon';
  import TicketIcon from 'phosphor-svelte/lib/TicketIcon';
  import ClockIcon from 'phosphor-svelte/lib/ClockIcon';

  let { agentTickets, loading = false }: { agentTickets: Ticket[]; loading?: boolean } = $props();

  type StatCardData = {
    title: string;
    value: number | string;
    suffix?: string;
    color?: string;
    info?: string;
    icon: typeof ArrowsClockwiseIcon;
  };

  const agentStats = $derived.by((): StatCardData[] => {
    const by = (s: string) => agentTickets.filter((t) => t.status === s).length;
    const done = agentTickets.filter((t) => t.status === 'resolved' || t.status === 'closed');
    const avgMs = done.length
      ? done.reduce((sum, t) => sum + resolutionMs(t), 0) / done.length
      : null;
    return [
      { title: 'In Progress', value: by('in_progress'), color: STATUS_COLORS['in_progress'], icon: ArrowsClockwiseIcon },
      { title: 'Waiting', value: by('waiting_for_response'), color: STATUS_COLORS['waiting_for_response'], icon: HourglassIcon },
      { title: 'Resolved', value: by('resolved'), color: STATUS_COLORS['resolved'], icon: CheckCircleIcon },
      { title: 'Closed', value: by('closed'), color: STATUS_COLORS['closed'], icon: ArchiveIcon },
      {
        title: 'Lifetime Assigned',
        value: agentTickets.length,
        info: 'Total tickets assigned to this agent',
        icon: TicketIcon,
        color: '#3b82f6',
      },
      {
        title: 'Avg Resolution',
        value: avgMs !== null ? Math.round(avgMs / 86_400_000) : '—',
        suffix: avgMs !== null ? 'd' : undefined,
        info: 'Average calendar days between ticket creation and it being marked resolved or closed.',
        icon: ClockIcon,
        color: '#ec4899',
      },
    ];
  });
</script>

<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
  {#each agentStats as card}
    <StatCard
      icon={card.icon}
      label={card.title}
      value={card.value}
      color={card.color}
      suffix={card.suffix}
      tooltip={card.info}
      {loading}
    />
  {/each}
</div>
