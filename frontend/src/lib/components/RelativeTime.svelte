<script lang="ts">
  let { date, class: className = '' }: { date: string | Date; class?: string } = $props();

  function formatRelativeTime(d: string | Date) {
    const diffMs = Date.now() - new Date(d).getTime();
    const minutes = Math.round(diffMs / 60_000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.round(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.round(months / 12);
    return `${years}y ago`;
  }

  let iso = $derived(new Date(date).toISOString());
  let exact = $derived(new Date(date).toLocaleString());
  let relative = $derived(formatRelativeTime(date));
</script>

<time datetime={iso} title={exact} class={className}>{relative}</time>
