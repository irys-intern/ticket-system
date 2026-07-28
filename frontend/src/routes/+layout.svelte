<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { fade } from 'svelte/transition';
  import { ModeWatcher } from 'mode-watcher';
  import { Toaster } from '$lib/components/ui/sonner';
  import { TooltipProvider } from '$lib/components/ui/tooltip';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import NotificationBell from '$lib/components/NotificationBell.svelte';
  import NavigationProgress from '$lib/components/NavigationProgress.svelte';
  import { flushQueuedToast } from '$lib/toast';
  import './layout.css';
  import type { LayoutData } from './$types';
  let { children, data }: {children: Snippet; data: LayoutData} = $props();

  onMount(() => {
    flushQueuedToast();
  });
</script>

<ModeWatcher defaultMode="system" />
<Toaster />
<NavigationProgress />

<TooltipProvider>
  <div class="min-h-screen bg-background text-foreground antialiased flex flex-col">
    <header class="w-full border-b dark:border-border/40 bg-card py-4">
      <div class="mx-auto flex max-w-4xl items-center justify-between px-4">
        <a href={resolve('/')} class="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div class="h-10 w-10 flex items-center justify-center">
            <img src={data.siteIconUrl} alt="logo" />
          </div>
          <div>
            <p class="text-base font-semibold leading-tight">Ticket System</p>
            <!-- <p class="text-xs text-muted-foreground">Eli Friedman & Irys Technologies</p> -->
          </div>
        </a>
        <div class="flex items-center gap-1">
          {#if data.user}
            <NotificationBell />
          {/if}
          <ThemeToggle />
        </div>
      </div>
    </header>

    <main class="flex-1 flex flex-col">
      <div class="mx-auto w-full max-w-4xl px-4 py-10 flex-1 flex flex-col">
        {#key page.url.pathname}
          <div class="flex flex-1 flex-col" in:fade={{ duration: 150, delay: 100 }} out:fade={{ duration: 100 }}>
            {@render children()}
          </div>
        {/key}
      </div>
    </main>

    <footer class="w-full border-t dark:border-border/40 bg-card py-4 text-center text-xs text-muted-foreground">
      <span>&copy; 2026 Eli Friedman & Irys Technologies. All rights reserved.</span>
      <span class="mx-3 inline-block h-3 w-px align-middle bg-border"></span>
      <a href={resolve('/privacy')} class="underline underline-offset-4 hover:text-foreground transition-colors">Privacy Policy</a>
    </footer>
  </div>
</TooltipProvider>
