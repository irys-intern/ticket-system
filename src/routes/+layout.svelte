<script lang="ts">
  import { resolve } from '$app/paths';
  import './layout.css';
  let { children } = $props();
</script>
<main class="min-h-screen bg-slate-50 text-slate-900 antialiased">
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

