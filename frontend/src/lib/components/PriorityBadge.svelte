<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';

  let { priority }: { priority: string } = $props();

  const priorityVariant = (p: string) =>
    p === 'critical' || p === 'high' ? 'destructive'
    : 'secondary';

  const priorityClass = (p: string) =>
    p === 'critical' ? 'bg-destructive text-destructive-foreground dark:bg-destructive dark:text-destructive-foreground'
    : p === 'medium' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
    : '';
</script>

<Badge variant={priorityVariant(priority)} class={priorityClass(priority)}>{priority}</Badge>
