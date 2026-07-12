<script lang="ts">
  import type { Component } from 'svelte';
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';

  let {
    icon,
    label,
    description,
    href,
  }: {
    icon: Component<{ class?: string }>;
    label: string;
    description: string;
    href: string;
  } = $props();
</script>

<a
  {href}
  class="group ring-foreground/10 bg-card text-card-foreground flex items-start gap-3 rounded-xl p-4 text-sm ring-1 transition-colors hover:bg-accent/50"
>
  <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
    {#if icon}
      {@const Icon = icon}
      <Icon class="size-4.5" />
    {/if}
  </div>
  <div class="min-w-0 flex-1">
    <p class="font-medium leading-tight">{label}</p>
    <p class="text-xs text-muted-foreground">{description}</p>
  </div>
  <ArrowRightIcon class="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
</a>
