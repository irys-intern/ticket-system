<title>Edit Training Material</title>

<script lang="ts">
  import { resolve } from '$app/paths';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Label } from '$lib/components/ui/label';
  import BackLink from '$lib/components/BackLink.svelte';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';
  import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircleIcon';
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
  import FloppyDiskIcon from 'phosphor-svelte/lib/FloppyDiskIcon';
  import { untrack } from 'svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let slug = $derived(data.slug);
  let content = $state(untrack(() => data.content));
  let preview = $state('');
  let showPreview = $state(false);
  let saving = $state(false);
  let errorMsg = $state(untrack(() => data.errorMsg));
  let successMsg = $state('');

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

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <BackLink href={resolve('/admin/training')} label="Back to manage materials" />
    <a
      href={resolve(`/training/${slug}`)}
      class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >View published <ArrowRightIcon class="size-3.5" /></a>
  </div>

  <div>
    <h1 class="text-2xl font-bold tracking-tight">Edit: <span class="font-mono text-lg text-muted-foreground">{slug}</span></h1>
    <p class="text-sm text-muted-foreground">Update the content of this training material.</p>
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

  {#if !data.errorMsg}
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
            <div class="prose prose-sm dark:prose-invert max-w-none">
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
          <FloppyDiskIcon /> {saving ? 'Saving…' : 'Save'}
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
