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
    color,
    suffix,
  }: {
    icon: Component<{ class?: string }>;
    label: string;
    value?: string | number;
    tooltip?: string;
    loading?: boolean;
    color?: string;
    suffix?: string;
  } = $props();
</script>

<Card>
  <CardContent class="flex items-start gap-3">
    <div
      class="flex size-9 shrink-0 items-center justify-center rounded-lg {color ? '' : 'bg-primary/10 text-primary'}"
      style={color ? `background-color: ${color}1a; color: ${color}` : ''}
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
        <p class="text-3xl font-bold" in:fly|global={{ y: 10 }}>
          {value}{#if suffix}<span class="text-base font-normal text-muted-foreground ml-1">{suffix}</span>{/if}
        </p>
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
