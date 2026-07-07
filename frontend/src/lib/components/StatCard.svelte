<script lang="ts">
  import type { Component } from 'svelte';
  import { Card, CardContent } from '$lib/components/ui/card';
  import InfoTooltip from '$lib/components/InfoTooltip.svelte';

  let {
    icon,
    label,
    value,
    tooltip,
  }: {
    icon: Component<{ class?: string }>;
    label: string;
    value: string | number;
    tooltip?: string;
  } = $props();
</script>

<Card>
  <CardContent class="flex items-start gap-3">
    <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      {#if icon}
        {@const Icon = icon}
        <Icon class="size-4.5" />
      {/if}
    </div>
    <div class="min-w-0">
      <p class="text-3xl font-bold leading-tight">{value}</p>
      <p class="flex items-center gap-1 text-xs text-muted-foreground">
        {label}
        {#if tooltip}
          <InfoTooltip text={tooltip} />
        {/if}
      </p>
    </div>
  </CardContent>
</Card>
