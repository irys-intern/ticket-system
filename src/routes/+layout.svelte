<script lang="ts">
  import { resolve } from '$app/paths';
  import './layout.css';
  let { children } = $props();
</script>
<main class="min-h-screen bg-slate-50 text-slate-900 antialiased">
  <header class="w-full border-b border-slate-200 bg-white py-6">
    <div class="mx-auto flex max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 text-white flex items-center justify-center text-lg font-bold">
          <img src="/favicon.svg" alt="logo"/>
        </div>
        <div>
          <p class="text-lg font-semibold text-slate-900">Ticket System</p>
          <p class="text-sm text-slate-500">Irys Technologies</p>
        </div>
      </div>
    </div>
  </header>
  <div class="min-h-screen flex items-start justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-4xl">
      {@render children()}
    </div>
  </div>
  <footer class="w-full border-t border-slate-200 bg-slate-100 py-6 text-center text-sm text-slate-600">
    &copy; 2026 Irys Technologies. All rights reserved.<br>
    <a href={resolve("/privacy", {})}>Privacy Policy</a>
  </footer>
</main>

