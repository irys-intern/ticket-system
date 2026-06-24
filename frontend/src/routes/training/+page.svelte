<title>Training Materials</title>

<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';

  type Material = { slug: string; title: string };

  let materials = $state<Material[]>([]);
  let loading = $state(true);
  let errorMsg = $state('');
  let userRole = $state('');

  onMount(async () => {
    const [meRes, listRes] = await Promise.all([
      fetch(PUBLIC_BACKEND_URL + '/auth/me', { credentials: 'include' }),
      fetch(PUBLIC_BACKEND_URL + '/training', { credentials: 'include' }),
    ]);

    if (meRes.ok) {
      const me = await meRes.json();
      userRole = me.role ?? '';
    }

    if (!listRes.ok) {
      errorMsg = 'Failed to load training materials.';
      loading = false;
      return;
    }

    const data = await listRes.json();
    materials = data.materials ?? [];
    loading = false;
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <a
        href={resolve('/')}
        class="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
      >&larr; Return home</a>
    </div>
    {#if userRole === 'admin'}
      <a
        href={resolve('/admin/training')}
        class="text-sm font-medium underline underline-offset-4 hover:text-foreground text-muted-foreground"
      >Manage materials</a>
    {/if}
  </div>

  <h1 class="text-2xl font-bold tracking-tight">Training Materials</h1>

  {#if errorMsg}
    <Alert variant="destructive">
      <AlertDescription>{errorMsg}</AlertDescription>
    </Alert>
  {/if}

  {#if loading}
    <div class="space-y-3 animate-pulse">
      {#each Array(4) as _}
        <div class="h-16 rounded-xl bg-muted/30"></div>
      {/each}
    </div>
  {:else if materials.length === 0}
    <p class="text-muted-foreground text-sm">No training materials available yet.</p>
  {:else}
    <div class="space-y-3">
      {#each materials as m (m.slug)}
        <a href={resolve(`/training/${m.slug}`)}>
          <Card class="hover:bg-muted/30 transition-colors cursor-pointer">
            <CardHeader class="py-4">
              <CardTitle class="text-base">{m.title}</CardTitle>
            </CardHeader>
          </Card>
        </a>
      {/each}
    </div>
  {/if}
</div>
