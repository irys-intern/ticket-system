<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import CaretDoubleLeftIcon from 'phosphor-svelte/lib/CaretDoubleLeftIcon';
  import CaretDoubleRightIcon from 'phosphor-svelte/lib/CaretDoubleRightIcon';
  import CaretLeftIcon from 'phosphor-svelte/lib/CaretLeftIcon';
  import CaretRightIcon from 'phosphor-svelte/lib/CaretRightIcon';
  import CircleNotchIcon from 'phosphor-svelte/lib/CircleNotchIcon';
  import { untrack } from 'svelte';

  let {
    page,
    totalPages,
    total,
    onPageChange,
  }: {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
  } = $props();

  let jumpTo = $state(untrack(() => String(page)));
  $effect(() => {
    jumpTo = String(page);
  });

  function clamp(p: number) {
    return Math.min(totalPages, Math.max(1, p));
  }

  function jump() {
    const parsed = Number.parseInt(jumpTo, 10);
    if (Number.isFinite(parsed) && clamp(parsed) !== page) requestPage(clamp(parsed));
    else jumpTo = String(page);
  }

  function submitJump(event: Event) {
    event.preventDefault();
    jump();
  }

  // Set the moment a page change is requested; cleared once the parent has
  // actually re-rendered with fresh data for the new page (rather than relying
  // on SvelteKit's `navigating` state, which doesn't reliably cover same-route
  // query-param-only navigations). A minimum visible stretch keeps the spinner
  // from just flashing for a single frame on a fast connection.
  let loading = $state(false);
  let loadingSince = 0;
  let clearTimer: ReturnType<typeof setTimeout>;
  const MIN_VISIBLE_MS = 150;

  function requestPage(p: number) {
    if (!loading) {
      loading = true;
      loadingSince = Date.now();
    }
    onPageChange(p);
  }

  $effect(() => {
    // Re-runs whenever the parent supplies new page data.
    void page;
    void totalPages;
    void total;
    if (!loading) return;
    clearTimeout(clearTimer);
    const elapsed = Date.now() - loadingSince;
    if (elapsed >= MIN_VISIBLE_MS) {
      loading = false;
    } else {
      clearTimer = setTimeout(() => (loading = false), MIN_VISIBLE_MS - elapsed);
    }
  });
</script>

<div class="flex flex-wrap items-center justify-between gap-2">
  <p class="flex items-center gap-1.5 text-xs text-muted-foreground">
    {#if loading}
      <CircleNotchIcon class="size-3 animate-spin" />
    {/if}
    Page {page} of {totalPages} &middot; {total} total
  </p>
  <div class="flex items-center gap-1.5">
    <Button
      size="sm"
      variant="outline"
      title="First page"
      disabled={page <= 1 || loading}
      onclick={() => requestPage(1)}
    >
      <CaretDoubleLeftIcon />
    </Button>
    <Button
      size="sm"
      variant="outline"
      disabled={page <= 1 || loading}
      onclick={() => requestPage(page - 1)}
    >
      <CaretLeftIcon /> Prev
    </Button>
    <form class="flex items-center gap-1" onsubmit={submitJump}>
      <Input
        type="number"
        min="1"
        max={totalPages}
        bind:value={jumpTo}
        onblur={jump}
        disabled={loading}
        class="h-7 w-14 px-1.5 text-center"
        aria-label="Jump to page"
      />
      <Button size="sm" variant="outline" type="submit" disabled={loading}>Go</Button>
    </form>
    <Button
      size="sm"
      variant="outline"
      disabled={page >= totalPages || loading}
      onclick={() => requestPage(page + 1)}
    >
      Next <CaretRightIcon />
    </Button>
    <Button
      size="sm"
      variant="outline"
      title="Last page"
      disabled={page >= totalPages || loading}
      onclick={() => requestPage(totalPages)}
    >
      <CaretDoubleRightIcon />
    </Button>
  </div>
</div>
