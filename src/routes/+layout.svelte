<script lang="ts">
  import './layout.css';
  let { children } = $props();
</script>
<main class="min-h-screen bg-slate-50 text-slate-900 antialiased">
  <div class="min-h-screen flex items-start justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-4xl">
      {@render children()}
    </div>
  </div>
</main>
