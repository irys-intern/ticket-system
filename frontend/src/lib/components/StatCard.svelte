<script lang="ts">
  import InfoTooltip from '$lib/components/InfoTooltip.svelte';
  import { Card, CardContent } from '$lib/components/ui/card';
  import type { Component } from 'svelte';
  import { fly } from 'svelte/transition';

  let {
    icon,
    label,
    value,
    tooltip,
    loading = false,
  }: {
    icon: Component<{ class?: string }>;
    label: string;
    value?: string | number;
    tooltip?: string;
    loading?: boolean;
  } = $props();
</script>

<Card>
  <CardContent class="flex items-start gap-3">
    <div
      class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
    >
      {#if icon}
        {@const Icon = icon}
        <Icon class="size-4.5" />
      {/if}
    </div>
    <div class="min-w-0">
      {#if loading}
        <span class="inline-block h-9 w-10 animate-pulse rounded bg-muted align-middle"></span>
      {:else}
        <p class="text-3xl font-bold" in:fly|global={{ y: 10 }}>{value}</p>
      {/if}
      <p class="flex items-center gap-1 text-xs text-muted-foreground">
        {label}
        {#if tooltip}
          <InfoTooltip text={tooltip} />
        {/if}
      </p>
    </div>
  </CardContent>
</Card>
