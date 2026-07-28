<script lang="ts">
  import { onMount } from 'svelte';
  import { scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { goto } from '$app/navigation';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import BellIcon from 'phosphor-svelte/lib/BellIcon';
  import BellSlashIcon from 'phosphor-svelte/lib/BellSlashIcon';
  import CheckCheckIcon from 'phosphor-svelte/lib/ChecksIcon';
  import { Badge } from '$lib/components/ui/badge';

  type Notification = {
    id: number;
    message: string;
    link: string | null;
    read: boolean;
    createdAt: string;
  };

  let open = $state(false);
  let unreadCount = $state(0);
  let notifications = $state<Notification[]>([]);
  let filter = $state<'all' | 'unread'>('all');
  let container: HTMLDivElement | undefined = $state();

  let visibleNotifications = $derived(
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications
  );

  function formatRelativeTime(iso: string) {
    const deltaMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.round(deltaMs / 60_000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
  }

  async function fetchUnreadCount() {
    const res = await fetch(PUBLIC_BACKEND_URL + '/notifications/unread-count', {
      credentials: 'include',
    });
    if (!res.ok) return;
    const data = await res.json();
    unreadCount = data.count ?? 0;
  }

  async function fetchNotifications() {
    const res = await fetch(PUBLIC_BACKEND_URL + '/notifications', { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();
    notifications = data.notifications ?? [];
  }

  async function toggleOpen() {
    open = !open;
    if (open) {
      await fetchNotifications();
    }
  }

  async function markRead(notification: Notification) {
    if (!notification.read) {
      const res = await fetch(PUBLIC_BACKEND_URL + `/notifications/${notification.id}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        notification.read = true;
        unreadCount = Math.max(0, unreadCount - 1);
      }
    }
    if (notification.link) {
      open = false;
      await goto(notification.link);
    }
  }

  async function markAllRead() {
    if (unreadCount === 0) return;
    const res = await fetch(PUBLIC_BACKEND_URL + '/notifications/read-all', {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return;
    notifications = notifications.map((n) => ({ ...n, read: true }));
    unreadCount = 0;
    open = false;
  }

  function handleClickOutside(event: MouseEvent) {
    if (open && container && !container.contains(event.target as Node)) {
      open = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (open && event.key === 'Escape') open = false;
  }

  // Fired by pages that mark notifications read as a side effect of being
  // visited (e.g. opening a ticket clears its notifications) so the badge
  // count doesn't wait for the next 30s poll.
  function handleExternalRefresh() {
    fetchUnreadCount();
    if (open) fetchNotifications();
  }

  onMount(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('notifications:refresh', handleExternalRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('notifications:refresh', handleExternalRefresh);
    };
  });
</script>

<div class="relative" bind:this={container}>
  <button
    type="button"
    onclick={toggleOpen}
    aria-label="Notifications"
    aria-expanded={open}
    class="relative inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
  >
    <BellIcon class="size-4" weight={unreadCount > 0 ? 'fill' : 'regular'} />
    {#if unreadCount > 0}
      <Badge
        variant="destructive"
        class="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px] leading-none shadow-sm"
      >
        {unreadCount > 9 ? '9+' : unreadCount}
      </Badge>
    {/if}
  </button>

  {#if open}
    <div
      transition:scale={{ start: 0.96, duration: 140, easing: quintOut }}
      class="absolute right-0 z-50 mt-2 w-84 origin-top-right overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg ring-1 ring-black/5 dark:ring-white/10"
    >
      <div class="flex items-center justify-between px-4 py-3">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold">Notifications</span>
          {#if unreadCount > 0}
            <Badge variant="secondary" class="h-4.5 px-1.5 text-[10px]">{unreadCount} new</Badge>
          {/if}
        </div>
        {#if unreadCount > 0}
          <button
            type="button"
            onclick={markAllRead}
            class="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            <CheckCheckIcon class="size-3.5" /> Mark all read
          </button>
        {/if}
      </div>

      <div class="border-t"></div>

      <div class="flex items-center gap-1 px-2.5 pt-2">
        {#each [{ key: 'all', label: 'All' }, { key: 'unread', label: 'Unread' }] as tab (tab.key)}
          <button
            type="button"
            onclick={() => (filter = tab.key as 'all' | 'unread')}
            class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors {filter === tab.key
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground'}"
          >
            {tab.label}
          </button>
        {/each}
      </div>

      <div class="max-h-80 overflow-y-auto p-1.5">
        {#if visibleNotifications.length === 0}
          <div class="flex flex-col items-center gap-2 px-3 py-10 text-center">
            <BellSlashIcon class="size-6 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">
              {filter === 'unread' ? "No unread notifications." : "You're all caught up."}
            </p>
          </div>
        {:else}
          {#each visibleNotifications as notification (notification.id)}
            <button
              type="button"
              onclick={() => markRead(notification)}
              class="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm transition-colors hover:bg-accent {notification.read
                ? ''
                : 'bg-primary/5'}"
            >
              <span
                class="mt-1.5 size-1.5 shrink-0 rounded-full {notification.read
                  ? 'bg-transparent'
                  : 'bg-primary'}"
              ></span>
              <span class="flex flex-1 flex-col gap-0.5">
                <span class={notification.read ? 'text-muted-foreground' : 'font-medium'}
                  >{notification.message}</span
                >
                <span class="text-xs text-muted-foreground"
                  >{formatRelativeTime(notification.createdAt)}</span
                >
              </span>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>
