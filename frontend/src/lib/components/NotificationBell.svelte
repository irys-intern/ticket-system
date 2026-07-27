<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import BellIcon from 'phosphor-svelte/lib/BellIcon';
  import BellSlashIcon from 'phosphor-svelte/lib/BellSlashIcon';
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
  let container: HTMLDivElement | undefined = $state();

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
    const res = await fetch('/notifications/unread-count');
    if (!res.ok) return;
    const data = await res.json();
    unreadCount = data.count ?? 0;
  }

  async function fetchNotifications() {
    const res = await fetch('/notifications');
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
    if (notification.read) return;
    const res = await fetch(`/notifications/${notification.id}/read`, { method: 'POST' });
    if (!res.ok) return;
    notification.read = true;
    unreadCount = Math.max(0, unreadCount - 1);
  }

  async function markAllRead() {
    if (unreadCount === 0) return;
    const res = await fetch('/notifications/read-all', { method: 'POST' });
    if (!res.ok) return;
    notifications = notifications.map((n) => ({ ...n, read: true }));
    unreadCount = 0;
  }

  function handleClickOutside(event: MouseEvent) {
    if (open && container && !container.contains(event.target as Node)) {
      open = false;
    }
  }

  onMount(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    window.addEventListener('click', handleClickOutside);
    return () => {
      clearInterval(interval);
      window.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div class="relative" bind:this={container}>
  <button
    type="button"
    onclick={toggleOpen}
    aria-label="Notifications"
    class="relative inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
  >
    <BellIcon class="size-4" />
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
      transition:fly={{ y: -4, duration: 120 }}
      class="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border bg-card shadow-lg ring-1 ring-black/5 dark:ring-white/10"
    >
      <div class="flex items-center justify-between border-b px-3.5 py-2.5">
        <span class="text-sm font-semibold">Notifications</span>
        {#if unreadCount > 0}
          <button
            type="button"
            onclick={markAllRead}
            class="text-xs font-medium text-primary hover:underline"
          >
            Mark all as read
          </button>
        {/if}
      </div>
      <div class="max-h-80 divide-y overflow-y-auto">
        {#if notifications.length === 0}
          <div class="flex flex-col items-center gap-2 px-3 py-8 text-center">
            <BellSlashIcon class="size-6 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">You're all caught up.</p>
          </div>
        {:else}
          {#each notifications as notification (notification.id)}
            <button
              type="button"
              onclick={() => markRead(notification)}
              class="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
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
