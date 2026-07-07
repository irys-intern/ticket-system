<script lang="ts">
  import { mode, toggleMode } from 'mode-watcher';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import SunIcon from 'phosphor-svelte/lib/SunIcon';
  import MoonIcon from 'phosphor-svelte/lib/MoonIcon';

  const label = () => (mode.current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
</script>

<Tooltip.Root>
  <Tooltip.Trigger>
    {#snippet child({ props })}
      <button
        {...props}
        type="button"
        onclick={toggleMode}
        aria-label={label()}
        class="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <span class="relative block size-4">
          <SunIcon class="absolute inset-0 size-4 scale-100 transition-all dark:scale-0" />
          <MoonIcon class="absolute inset-0 size-4 scale-0 transition-all dark:scale-100" />
        </span>
      </button>
    {/snippet}
  </Tooltip.Trigger>
  <Tooltip.Content>{label()}</Tooltip.Content>
</Tooltip.Root>
