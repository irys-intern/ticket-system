<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import CaretDoubleLeftIcon from 'phosphor-svelte/lib/CaretDoubleLeftIcon';
  import CaretDoubleRightIcon from 'phosphor-svelte/lib/CaretDoubleRightIcon';
  import CaretLeftIcon from 'phosphor-svelte/lib/CaretLeftIcon';
  import CaretRightIcon from 'phosphor-svelte/lib/CaretRightIcon';
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
    if (Number.isFinite(parsed) && clamp(parsed) !== page) onPageChange(clamp(parsed));
    else jumpTo = String(page);
  }

  function submitJump(event: Event) {
    event.preventDefault();
    jump();
  }
</script>

<div class="flex flex-wrap items-center justify-between gap-2">
  <p class="text-xs text-muted-foreground">
    Page {page} of {totalPages} &middot; {total} total
  </p>
  <div class="flex items-center gap-1.5">
    <Button
      size="sm"
      variant="outline"
      title="First page"
      disabled={page <= 1}
      onclick={() => onPageChange(1)}
    >
      <CaretDoubleLeftIcon />
    </Button>
    <Button size="sm" variant="outline" disabled={page <= 1} onclick={() => onPageChange(page - 1)}>
      <CaretLeftIcon /> Prev
    </Button>
    <form class="flex items-center gap-1" onsubmit={submitJump}>
      <Input
        type="number"
        min="1"
        max={totalPages}
        bind:value={jumpTo}
        onblur={jump}
        class="h-8 w-14 px-1.5 text-center"
        aria-label="Jump to page"
      />
      <Button size="sm" variant="outline" type="submit">Go</Button>
    </form>
    <Button
      size="sm"
      variant="outline"
      disabled={page >= totalPages}
      onclick={() => onPageChange(page + 1)}
    >
      Next <CaretRightIcon />
    </Button>
    <Button
      size="sm"
      variant="outline"
      title="Last page"
      disabled={page >= totalPages}
      onclick={() => onPageChange(totalPages)}
    >
      <CaretDoubleRightIcon />
    </Button>
  </div>
</div>
