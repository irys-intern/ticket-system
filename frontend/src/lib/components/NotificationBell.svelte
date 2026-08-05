<script lang="ts">
  import { onMount } from 'svelte';
  import { scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import { authHeaders } from '$lib/auth';
  import BellIcon from 'phosphor-svelte/lib/BellIcon';
  import BellSlashIcon from 'phosphor-svelte/lib/BellSlashIcon';
  import CheckCheckIcon from 'phosphor-svelte/lib/ChecksIcon';
  import TrashSimpleIcon from 'phosphor-svelte/lib/TrashSimpleIcon';
  import WarningIcon from 'phosphor-svelte/lib/WarningIcon';
  import XIcon from 'phosphor-svelte/lib/XIcon';
  import { Badge } from '$lib/components/ui/badge';
  import * as Tooltip from '$lib/components/ui/tooltip';

  type Notification = {
    id: number;
    message: string;
    link: string | null;
    read: boolean;
    createdAt: string;
  };

  type WaitingTicket = { id: number; title: string; updatedAt: string };

  const WAITING_DISMISSED_KEY = 'waitingTicketsDismissed';

  let open = $state(false);
  let unreadCount = $state(0);
  let notifications = $state<Notification[]>([]);
  let filter = $state<'all' | 'unread'>('all');
  let container: HTMLDivElement | undefined = $state();
  let waitingTickets = $state<WaitingTicket[]>([]);
  let waitingDismissed = $state(false);
  let listEl: HTMLDivElement | undefined = $state();
  let listScrolled = $state(false);

  function handleListScroll() {
    listScrolled = (listEl?.scrollTop ?? 0) > 0;
  }

  let showWaitingCard = $derived(waitingTickets.length > 0 && !waitingDismissed);

  function waitingKey(tickets: WaitingTicket[]) {
    return tickets
      .map((t) => `${t.id}:${t.updatedAt}`)
      .sort()
      .join(',');
  }

  function dismissWaitingCard() {
    waitingDismissed = true;
    try {
      localStorage.setItem(WAITING_DISMISSED_KEY, waitingKey(waitingTickets));
    } catch {
      // localStorage unavailable (e.g. private browsing) -- dismissal just won't persist
    }
  }

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
      headers: authHeaders(),
    });
    if (!res.ok) return;
    const data = await res.json();
    unreadCount = data.count ?? 0;
  }

  async function fetchNotifications() {
    const res = await fetch(PUBLIC_BACKEND_URL + '/notifications', { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    notifications = data.notifications ?? [];
  }

  async function fetchWaitingTickets() {
    const res = await fetch(PUBLIC_BACKEND_URL + '/', { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    if (data.userRole !== 'user') return;
    const tickets = (data.progressTicketsUser ?? []) as {
      id: number;
      title: string;
      status: string;
      updatedAt: string;
    }[];
    waitingTickets = tickets
      .filter((t) => t.status === 'waiting_for_response')
      .map((t) => ({ id: t.id, title: t.title, updatedAt: t.updatedAt }));

    let dismissedKey: string | null = null;
    try {
      dismissedKey = localStorage.getItem(WAITING_DISMISSED_KEY);
    } catch {
      // localStorage unavailable -- treat as nothing dismissed
    }
    waitingDismissed = dismissedKey !== null && dismissedKey === waitingKey(waitingTickets);
  }

  async function toggleOpen() {
    open = !open;
    if (open) {
      listScrolled = false;
      await fetchNotifications();
    }
  }

  async function markRead(notification: Notification) {
    if (!notification.read) {
      const res = await fetch(PUBLIC_BACKEND_URL + `/notifications/${notification.id}/read`, {
        method: 'POST',
        headers: authHeaders(),
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
      headers: authHeaders(),
    });
    if (!res.ok) return;
    notifications = notifications.map((n) => ({ ...n, read: true }));
    unreadCount = 0;
    open = false;
  }

  async function clearAll() {
    if (notifications.length === 0) return;
    const res = await fetch(PUBLIC_BACKEND_URL + '/notifications/clear', {
      method: 'POST',
      headers: authHeaders(),
    });
    if (!res.ok) return;
    notifications = [];
    unreadCount = 0;
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
    fetchWaitingTickets();
    if (open) fetchNotifications();
  }

  onMount(() => {
    fetchUnreadCount();
    fetchWaitingTickets();
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchWaitingTickets();
    }, 30_000);
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

  {#if showWaitingCard && !open}
    <div
      transition:scale={{ start: 0.96, duration: 140, easing: quintOut }}
      class="absolute right-0 z-50 mt-2 w-max max-w-[calc(100vw-2rem)] origin-top-right rounded-xl bg-popover p-3 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10"
    >
      <div class="flex gap-2.5">
        <WarningIcon class="size-4 shrink-0 translate-y-0.5 text-amber-600 dark:text-amber-400" />
        <div class="min-w-0 flex-1">
          <p class="font-medium whitespace-nowrap">
            {waitingTickets.length === 1
              ? 'A ticket is waiting for your response.'
              : `${waitingTickets.length} tickets are waiting for your response.`}
          </p>
          <p class="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-muted-foreground">
            {#each waitingTickets as ticket, i (ticket.id)}
              <a
                href={resolve(`/tickets/${ticket.id}`)}
                class="underline underline-offset-2 hover:text-foreground"
              >
                #{ticket.id} {ticket.title}
              </a>{#if i < waitingTickets.length - 1}<span class="text-muted-foreground/50">&middot;</span>{/if}
            {/each}
          </p>
        </div>
        <button
          type="button"
          onclick={dismissWaitingCard}
          aria-label="Dismiss"
          class="inline-flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <XIcon class="size-3.5" />
        </button>
      </div>
    </div>
  {/if}

  {#if open}
    <div
      transition:scale={{ start: 0.96, duration: 140, easing: quintOut }}
      class="absolute right-0 z-50 mt-2 w-84 origin-top-right overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10"
    >
      <div class="flex items-center justify-between px-4 py-3">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold">Notifications</span>
          {#if unreadCount > 0}
            <Badge variant="secondary" class="h-4.5 px-1.5 text-[10px]">{unreadCount} new</Badge>
          {/if}
        </div>
        <div class="flex items-center gap-0.5">
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <button
                  {...props}
                  type="button"
                  onclick={markAllRead}
                  disabled={unreadCount === 0}
                  aria-label="Mark all read"
                  class="inline-flex size-7 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:text-muted-foreground/50 disabled:hover:bg-transparent"
                >
                  <CheckCheckIcon class="size-3.5" />
                </button>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content>Mark all read</Tooltip.Content>
          </Tooltip.Root>
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <button
                  {...props}
                  type="button"
                  onclick={clearAll}
                  disabled={notifications.length === 0}
                  aria-label="Clear notifications"
                  class="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:text-muted-foreground/50 disabled:hover:bg-transparent"
                >
                  <TrashSimpleIcon class="size-3.5" />
                </button>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content>Clear notifications</Tooltip.Content>
          </Tooltip.Root>
        </div>
      </div>

      <div class="border-t border-border/40"></div>

      <div class="flex items-center gap-1 px-2.5 pt-2">
        {#each [{ key: 'all', label: 'All' }, { key: 'unread', label: 'Unread' }] as tab (tab.key)}
          <button
            type="button"
            onclick={() => {
              filter = tab.key as 'all' | 'unread';
              if (listEl) listEl.scrollTop = 0;
              listScrolled = false;
            }}
            class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors {filter === tab.key
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground ' + ((tab.key === 'unread' && unreadCount === 0) ? '' : 'hover:text-foreground')}"
            disabled={tab.key === 'unread' && unreadCount === 0}
          >
            {tab.label}
          </button>
        {/each}
      </div>

      <div class="relative">
        <div
          class="pointer-events-none absolute inset-x-0 top-0 z-10 h-4 bg-linear-to-b from-popover to-transparent transition-opacity duration-150 {listScrolled
            ? 'opacity-100'
            : 'opacity-0'}"
        ></div>
        <div
          bind:this={listEl}
          onscroll={handleListScroll}
          class="max-h-80 overflow-y-auto p-1.5"
        >
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
              class="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm transition-colors hover:bg-accent"
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
    </div>
  {/if}
</div>
