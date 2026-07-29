// Mirrors frontend/src/lib/components/stats/TicketDistributionChart.svelte's
// `priorityWarning` logic exactly, so an agent whose distribution would flag
// a warning on the admin stats page gets notified about it themselves first.
// The two apps don't share code, so keep this in sync with that component by hand.
export function computePriorityWarning(tickets: { priority: string }[]): string | null {
  if (tickets.length < 5) return null;
  const total = tickets.length;
  const pct = (p: string) => tickets.filter((t) => t.priority === p).length / total;
  const lowPct = pct('low');
  const medPct = pct('medium');
  const highPct = pct('high');
  const critPct = pct('critical');
  const maxPct = Math.max(lowPct, medPct, highPct, critPct);
  if (maxPct > 0.8) return 'Nearly all of your tickets share one priority level! Classifications may not be organic.';
  if (critPct > 0.2) return 'Critical tickets exceed 20% of your queue. This may indicate over-escalation.';
  if (critPct > medPct) return 'You have more critical than medium-priority tickets, which is atypical for a healthy queue.';
  if (highPct > medPct) return 'High-priority tickets outnumber medium-priority ones in your queue -- the skew is unusually severe.';
  return null;
}
