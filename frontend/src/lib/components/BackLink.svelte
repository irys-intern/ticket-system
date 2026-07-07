<script lang="ts">
  import ArrowLeftIcon from 'phosphor-svelte/lib/ArrowLeftIcon';

  let { href, label = 'Return home' }: { href: string; label?: string } = $props();
</script>

<a {href} class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
  <ArrowLeftIcon class="size-3.5" /> {label}
</a>
