<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from '$lib/components/ui/dialog';
  import { toast } from '$lib/toast';
  import CaretDownIcon from 'phosphor-svelte/lib/CaretDownIcon';
  import SignOutIcon from 'phosphor-svelte/lib/SignOutIcon';
  import { onMount } from 'svelte';
  import { scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  let { user }: { user: { userId: string; email: string; name: string; role: string } } = $props();

  let open = $state(false);
  let showLogoutDialog = $state(false);
  let container: HTMLDivElement | undefined = $state();

  function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  function handleClickOutside(event: MouseEvent) {
    if (open && container && !container.contains(event.target as Node)) {
      open = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (open && event.key === 'Escape') open = false;
  }

  async function handleLogout() {
    const response = await fetch(`${PUBLIC_BACKEND_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    showLogoutDialog = false;
    if (response.ok) {
      toast.success('Signed out.');
      await goto(resolve('/'), { replaceState: true, invalidateAll: true });
    } else {
      toast.error('Unable to log out. Please try again later.');
    }
  }

  onMount(() => {
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<div class="relative" bind:this={container}>
  <button
    type="button"
    onclick={() => (open = !open)}
    aria-label="Profile menu"
    aria-expanded={open}
    class="flex items-center gap-1 rounded-lg py-1 pr-1.5 pl-1 transition-colors hover:bg-muted"
  >
    <span
      class="flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary/70 text-xs font-semibold text-primary-foreground ring-2 ring-transparent transition-shadow {open
        ? 'ring-primary/30'
        : ''}"
    >
      {initials(user.name)}
    </span>
    <CaretDownIcon
      class="size-3.5 text-muted-foreground transition-transform duration-150 {open ? 'rotate-180' : ''}"
    />
  </button>

  {#if open}
    <div
      transition:scale={{ start: 0.96, duration: 140, easing: quintOut }}
      class="absolute right-0 z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg ring-1 ring-black/5 dark:ring-white/10"
    >
      <div class="flex items-center gap-3 px-4 py-3.5">
        <span
          class="flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary/70 text-sm font-semibold text-primary-foreground"
        >
          {initials(user.name)}
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold" title={user.name}>{user.name}</p>
          <p class="truncate text-xs text-muted-foreground" title={user.email}>{user.email}</p>
        </div>
      </div>

      <div class="px-4 pb-3">
        <Badge variant="secondary" class="capitalize">{user.role}</Badge>
      </div>

      <div class="border-t"></div>

      <div class="p-1.5">
        <button
          type="button"
          onclick={() => {
            open = false;
            showLogoutDialog = true;
          }}
          class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
        >
          <SignOutIcon class="size-4" /> Log Out
        </button>
      </div>
    </div>
  {/if}
</div>

<Dialog bind:open={showLogoutDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Log out</DialogTitle>
    </DialogHeader>
    <p class="text-sm text-muted-foreground">Are you sure you want to log out?</p>
    <DialogFooter>
      <Button variant="outline" onclick={() => (showLogoutDialog = false)}>Cancel</Button>
      <Button variant="destructive" onclick={handleLogout}><SignOutIcon /> Log Out</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
