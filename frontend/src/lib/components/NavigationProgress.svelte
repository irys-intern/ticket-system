<script lang="ts">
  import { navigating } from '$app/state';

  // Any client-side navigation (link click, goto, form-driven redirect) sets
  // `navigating.to` until the destination's load functions resolve -- show a
  // top-of-page bar for that whole window so a press always has some feedback
  // even before the old page unmounts.
  let visible = $state(false);
  let hideTimeout: ReturnType<typeof setTimeout>;

  $effect(() => {
    if (navigating.to) {
      clearTimeout(hideTimeout);
      visible = true;
    } else if (visible) {
      // Let the bar visibly reach the end instead of vanishing mid-slide.
      hideTimeout = setTimeout(() => (visible = false), 150);
    }
  });
</script>

{#if visible}
  <div class="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-primary/15">
    <div class="loading-bar h-full w-1/3 rounded-full bg-primary"></div>
  </div>
{/if}
