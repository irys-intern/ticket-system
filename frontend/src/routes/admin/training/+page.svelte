<title>Manage Training Materials</title>

<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import BackLink from '$lib/components/BackLink.svelte';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircleIcon';
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
  import PlusCircleIcon from 'phosphor-svelte/lib/PlusCircleIcon';
  import PencilSimpleIcon from 'phosphor-svelte/lib/PencilSimpleIcon';
  import TrashIcon from 'phosphor-svelte/lib/TrashIcon';

  type Material = { slug: string; title: string };

  let materials = $state<Material[]>([]);
  let loading = $state(true);
  let errorMsg = $state('');
  let successMsg = $state('');

  let newTitle = $state('');
  let newContent = $state('');
  let creating = $state(false);
  let deletingSlug = $state('');

  onMount(async () => {
    await loadMaterials();
  });

  async function loadMaterials() {
    loading = true;
    errorMsg = '';
    const res = await fetch(PUBLIC_BACKEND_URL + '/training', { credentials: 'include' });
    if (!res.ok) {
      errorMsg = 'Failed to load materials.';
      loading = false;
      return;
    }
    const data = await res.json();
    materials = data.materials ?? [];
    loading = false;
  }

  async function handleCreate(e: Event) {
    e.preventDefault();
    creating = true;
    errorMsg = '';
    successMsg = '';

    const res = await fetch(PUBLIC_BACKEND_URL + '/training', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: newTitle, content: newContent }),
    });

    const data = await res.json();
    creating = false;

    if (!res.ok) {
      errorMsg = data.message ?? 'Failed to create material.';
      return;
    }

    successMsg = `Created "${newTitle}". You can now edit it.`;
    newTitle = '';
    newContent = '';
    await loadMaterials();
  }

  async function handleDelete(slug: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deletingSlug = slug;
    errorMsg = '';
    successMsg = '';

    const res = await fetch(PUBLIC_BACKEND_URL + `/training/${slug}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    deletingSlug = '';
    if (!res.ok) {
      errorMsg = 'Failed to delete material.';
      return;
    }
    successMsg = `Deleted "${title}".`;
    await loadMaterials();
  }
</script>

<div class="space-y-4">
  <div>
    <BackLink href={resolve('/training')} label="Back to training materials" />
  </div>

  <div>
    <h1 class="text-2xl font-bold tracking-tight">Manage Training Materials</h1>
    <p class="text-sm text-muted-foreground">Create, edit, and organize training content for agents.</p>
  </div>

  {#if errorMsg}
    <Alert variant="destructive">
      <WarningCircleIcon />
      <AlertDescription>{errorMsg}</AlertDescription>
    </Alert>
  {/if}

  {#if successMsg}
    <Alert variant="success">
      <CheckCircleIcon />
      <AlertDescription>{successMsg}</AlertDescription>
    </Alert>
  {/if}

  <!-- Create new material -->
  <Card>
    <CardHeader>
      <CardTitle class="text-base">New Material</CardTitle>
    </CardHeader>
    <CardContent>
      <form onsubmit={handleCreate} class="space-y-4">
        <div class="space-y-1.5">
          <Label for="new-title">Title</Label>
          <Input
            id="new-title"
            bind:value={newTitle}
            placeholder="e.g. Escalation Policy"
            required
          />
        </div>
        <div class="space-y-1.5">
          <Label for="new-content">Content (Markdown)</Label>
          <textarea
            id="new-content"
            bind:value={newContent}
            placeholder="# Title&#10;&#10;Write your content here..."
            required
            rows={8}
            class="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring resize-y"
          ></textarea>
        </div>
        <Button type="submit" disabled={creating}>
          <PlusCircleIcon /> {creating ? 'Creating…' : 'Create'}
        </Button>
      </form>
    </CardContent>
  </Card>

  <!-- Existing materials -->
  <div class="space-y-3">
    <h2 class="text-lg font-semibold">Existing Materials</h2>

    {#if loading}
      <div class="space-y-2 animate-pulse">
        {#each Array(3) as _}
          <div class="h-14 rounded-xl bg-muted/30"></div>
        {/each}
      </div>
    {:else if materials.length === 0}
      <p class="text-sm text-muted-foreground">No materials yet.</p>
    {:else}
      {#each materials as m (m.slug)}
        <Card>
          <CardContent class="flex items-center justify-between py-4">
            <a
              href={resolve(`/training/${m.slug}`)}
              class="font-medium hover:underline underline-offset-4"
            >{m.title}</a>
            <div class="flex items-center gap-2">
              <Button
                href={resolve(`/admin/training/${m.slug}/edit`)}
                variant="outline"
                size="sm"
              ><PencilSimpleIcon /> Edit</Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={deletingSlug === m.slug}
                onclick={() => handleDelete(m.slug, m.title)}
              >
                <TrashIcon /> {deletingSlug === m.slug ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </CardContent>
        </Card>
      {/each}
    {/if}
  </div>
</div>
