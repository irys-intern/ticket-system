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
  import { fly } from 'svelte/transition';

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
    return () => window.removeEventListener('click', handleClickOutside);
  });
</script>

<div class="relative" bind:this={container}>
  <button
    type="button"
    onclick={() => (open = !open)}
    aria-label="Profile menu"
    class="flex items-center gap-1 rounded-lg py-1 pr-1 pl-1.5 text-sm transition-colors hover:bg-muted"
  >
    <span
      class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
    >
      {initials(user.name)}
    </span>
    <CaretDownIcon class="size-3.5 text-muted-foreground" />
  </button>

  {#if open}
    <div
      transition:fly={{ y: -4, duration: 120 }}
      class="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border bg-card shadow-lg ring-1 ring-black/5 dark:ring-white/10"
    >
      <div class="border-b px-3.5 py-2.5">
        <p class="truncate text-sm font-medium" title={user.name}>{user.name}</p>
        <p class="truncate text-xs text-muted-foreground" title={user.email}>{user.email}</p>
        <Badge variant="secondary" class="mt-1.5 capitalize">{user.role}</Badge>
      </div>
      <button
        type="button"
        onclick={() => {
          open = false;
          showLogoutDialog = true;
        }}
        class="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-muted/60"
      >
        <SignOutIcon class="size-4" /> Log Out
      </button>
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
