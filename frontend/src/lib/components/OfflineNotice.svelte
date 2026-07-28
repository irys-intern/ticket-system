<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import WifiSlashIcon from 'phosphor-svelte/lib/WifiSlashIcon';

  // `navigator.onLine` reflects the OS/browser's own network state, so this
  // fires immediately on disconnect -- no polling needed. It's a coarse
  // signal (it can say "online" on a captive portal with no real internet),
  // but it's the same primitive the service worker's fetch fallback relies
  // on, so the two stay consistent with each other.
  let offline = $state(false);

  onMount(() => {
    offline = !navigator.onLine;
    const goOffline = () => (offline = true);
    const goOnline = () => (offline = false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    // Belt-and-suspenders: `navigator.onLine` and the online/offline events are
    // technically independent, and some offline-simulation tools (browser
    // devtools, certain proxies/VPNs) flip the property without ever
    // dispatching the event. Poll as a backstop so the banner can't get stuck.
    const poll = setInterval(() => {
      if (offline !== !navigator.onLine) offline = !navigator.onLine;
    }, 2000);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
      clearInterval(poll);
    };
  });
</script>

{#if offline}
  <div
    transition:fly={{ y: -20, duration: 200 }}
    class="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-center text-sm font-medium text-destructive-foreground shadow-md"
    role="status"
  >
    <WifiSlashIcon class="size-4 shrink-0" />
    You're offline. Some features may not work until your connection is back.
  </div>
{/if}
