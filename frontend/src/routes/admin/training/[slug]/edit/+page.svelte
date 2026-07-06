<title>Edit Training Material</title>

<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Label } from '$lib/components/ui/label';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';

  let slug = $derived(page.params.slug);
  let content = $state('');
  let preview = $state('');
  let showPreview = $state(false);
  let loading = $state(true);
  let saving = $state(false);
  let errorMsg = $state('');
  let successMsg = $state('');

  onMount(async () => {
    const res = await fetch(PUBLIC_BACKEND_URL + `/training/${slug}`, { credentials: 'include' });
    if (!res.ok) {
      errorMsg = res.status === 404 ? 'Material not found.' : 'Failed to load material.';
      loading = false;
      return;
    }
    const data = await res.json();
    content = data.content ?? '';
    loading = false;
  });

  async function togglePreview() {
    if (!showPreview) {
      preview = DOMPurify.sanitize(await marked.parse(content));
    }
    showPreview = !showPreview;
  }

  async function handleSave(e: Event) {
    e.preventDefault();
    saving = true;
    errorMsg = '';
    successMsg = '';

    const res = await fetch(PUBLIC_BACKEND_URL + `/training/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content }),
    });

    saving = false;
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      errorMsg = data.message ?? 'Failed to save.';
      return;
    }
    successMsg = 'Saved.';
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <a
      href={resolve('/admin/training')}
      class="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
    >&larr; Back to manage materials</a>
    <a
      href={resolve(`/training/${slug}`)}
      class="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
    >View published &rarr;</a>
  </div>

  <h1 class="text-2xl font-bold tracking-tight">Edit: <span class="font-mono text-lg text-muted-foreground">{slug}</span></h1>

  {#if errorMsg}
    <Alert variant="destructive">
      <AlertDescription>{errorMsg}</AlertDescription>
    </Alert>
  {/if}

  {#if successMsg}
    <Alert>
      <AlertDescription>{successMsg}</AlertDescription>
    </Alert>
  {/if}

  {#if loading}
    <div class="h-64 rounded-xl bg-muted/30 animate-pulse"></div>
  {:else}
    <form onsubmit={handleSave} class="space-y-4">
      <div class="flex items-center justify-between">
        <Label for="content">Content (Markdown)</Label>
        <button
          type="button"
          onclick={togglePreview}
          class="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
        >{showPreview ? 'Hide preview' : 'Show preview'}</button>
      </div>

      {#if showPreview}
        <Card>
          <CardContent class="pt-6">
            <div class="prose prose-invert max-w-none">
              {@html preview}
            </div>
          </CardContent>
        </Card>
      {:else}
        <textarea
          id="content"
          bind:value={content}
          required
          rows={20}
          class="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring resize-y"
        ></textarea>
      {/if}

      <div class="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onclick={togglePreview}
        >{showPreview ? 'Back to editor' : 'Preview'}</Button>
      </div>
    </form>
  {/if}
</div>
