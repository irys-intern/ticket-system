<script lang="ts">
  import InfoTooltip from '$lib/components/InfoTooltip.svelte';
  import { Card, CardContent } from '$lib/components/ui/card';
  import type { Component } from 'svelte';
  import { untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import { spotlight } from '$lib/actions/spotlight';

  type IconWeight = 'bold' | 'duotone' | 'fill' | 'light' | 'thin' | 'regular';

  let {
    icon,
    label,
    value,
    tooltip,
    loading = false,
    color = 'var(--primary)',
    suffix,
  }: {
    icon: Component<{ class?: string; weight?: IconWeight }>;
    label: string;
    value?: string | number;
    tooltip?: string;
    loading?: boolean;
    color?: string;
    suffix?: string;
  } = $props();

  // Re-key the value on every change (e.g. switching the selected agent on
  // /admin/stats) so it always replays its enter/exit transition instead of
  // silently popping to the new number in place -- no in-between values are
  // shown. A higher value slides in from above (and pushes the old one down);
  // a lower value slides in from below (and pushes the old one up).
  let prevValue = $state(untrack(() => value));
  // Sign of the incoming value's start offset: -1 = from above, 1 = from below.
  let incomingSign = $state<1 | -1>(1);
  $effect(() => {
    if (typeof value === 'number' && typeof prevValue === 'number' && value !== prevValue) {
      incomingSign = value > prevValue ? -1 : 1;
    }
    prevValue = value;
  });
</script>

<Card size="sm" class="transition-shadow hover:shadow-md">
  <CardContent class="flex items-center gap-3.5">
    <div
      use:spotlight
      class="group relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg text-white shadow-sm"
      style="background-image: linear-gradient(135deg, {color}, color-mix(in srgb, {color} 70%, black));"
    >
      <div
        class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style="background: radial-gradient(circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(255,255,255,0.45), transparent 65%);"
      ></div>
      {#if icon}
        {@const Icon = icon}
        <Icon class="relative size-5" weight="fill" />
      {/if}
    </div>
    <div class="min-w-0">
      {#if loading}
        <span class="inline-block h-9 w-10 animate-pulse rounded bg-muted align-middle"></span>
      {:else}
        <div class="grid">
          {#key value}
            <p
              class="col-start-1 row-start-1 text-3xl font-bold tabular-nums"
              in:fly={{ y: incomingSign * 10}}
              out:fly={{ y: -incomingSign * 10}}
            >
              {value}{#if suffix}<span class="text-base font-normal text-muted-foreground ml-1">{suffix}</span>{/if}
            </p>
          {/key}
        </div>
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
