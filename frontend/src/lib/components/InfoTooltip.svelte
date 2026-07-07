<script lang="ts">
  import * as Tooltip from '$lib/components/ui/tooltip';
  import InfoIcon from 'phosphor-svelte/lib/InfoIcon';

  let { text }: { text: string } = $props();
</script>

<Tooltip.Root>
  <Tooltip.Trigger>
    {#snippet child({ props })}
      <button
        type="button"
        {...props}
        class="inline-flex items-center align-middle text-muted-foreground hover:text-foreground"
        aria-label={text}
      >
        <InfoIcon class="size-3.5" />
      </button>
    {/snippet}
  </Tooltip.Trigger>
  <Tooltip.Content>{text}</Tooltip.Content>
</Tooltip.Root>
