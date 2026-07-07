<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { ModeWatcher } from 'mode-watcher';
  import { Toaster } from '$lib/components/ui/sonner';
  import { TooltipProvider } from '$lib/components/ui/tooltip';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import { flushQueuedToast } from '$lib/toast';
  import './layout.css';
  let { children } = $props();

  onMount(() => {
    flushQueuedToast();
  });
</script>

<ModeWatcher defaultMode="dark" />
<Toaster />

<TooltipProvider>
  <div class="min-h-screen bg-background text-foreground antialiased flex flex-col">
    <header class="w-full border-b bg-card py-4">
      <div class="mx-auto flex max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href={resolve('/')} class="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div class="h-10 w-10 flex items-center justify-center">
            <img src="/favicon.svg" alt="logo" />
          </div>
          <div>
            <p class="text-base font-semibold leading-tight">Ticket System</p>
            <p class="text-xs text-muted-foreground">Eli Friedman & Irys Technologies</p>
          </div>
        </a>
        <ThemeToggle />
      </div>
    </header>

    <main class="flex-1 flex items-start justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-4xl">
        {@render children()}
      </div>
    </main>

    <footer class="w-full border-t bg-muted py-4 text-center text-xs text-muted-foreground">
      &copy; 2026 Eli Friedman & Irys Technologies. All rights reserved.
      &nbsp;|&nbsp;
      <a href={resolve('/privacy')} class="underline underline-offset-4 hover:text-foreground transition-colors">Privacy Policy</a>
    </footer>
  </div>
</TooltipProvider>
