<script lang="ts">
  import type { Component } from 'svelte';
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';
  import { spotlight } from '$lib/actions/spotlight';

  type IconWeight = 'bold' | 'duotone' | 'fill' | 'light' | 'thin' | 'regular';

  let {
    icon,
    label,
    description,
    href,
    color = 'var(--primary)',
  }: {
    icon: Component<{ class?: string; weight?: IconWeight }>;
    label: string;
    description: string;
    href: string;
    /** Distinct accent color for this tool's icon panel, so a row of these reads as separate destinations at a glance. */
    color?: string;
  } = $props();
</script>

<a
  {href}
  class="group ring-foreground/10 bg-card text-card-foreground flex items-center gap-5 rounded-2xl p-5 ring-1 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-primary/30"
>
  <div
    use:spotlight
    class="group/icon relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl text-white shadow-sm transition-transform group-hover:scale-105"
    style="background-image: linear-gradient(135deg, {color}, color-mix(in srgb, {color} 70%, black));"
  >
    <div
      class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/icon:opacity-100"
      style="background: radial-gradient(circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(255,255,255,0.45), transparent 65%);"
    ></div>
    {#if icon}
      {@const Icon = icon}
      <Icon class="relative size-7" weight="fill" />
    {/if}
  </div>
  <div class="min-w-0 flex-1">
    <p class="text-base font-semibold leading-tight">{label}</p>
    <p class="mt-1 text-sm text-muted-foreground">{description}</p>
  </div>
  <ArrowRightIcon
    class="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground"
  />
</a>
