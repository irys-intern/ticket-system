<title>Training Material</title>

<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Card, CardContent } from '$lib/components/ui/card';
  import BackLink from '$lib/components/BackLink.svelte';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';

  let content = $state('');
  let renderedHtml = $state('');
  let loading = $state(true);
  let errorMsg = $state('');
  let userRole = $state('');
  let slug = $derived(page.params.slug);

  onMount(async () => {
    const [meRes, matRes] = await Promise.all([
      fetch(PUBLIC_BACKEND_URL + '/auth/me', { credentials: 'include' }),
      fetch(PUBLIC_BACKEND_URL + `/training/${slug}`, { credentials: 'include' }),
    ]);

    if (meRes.ok) {
      const me = await meRes.json();
      userRole = me.session.role ?? '';
    }

    if (!matRes.ok) {
      errorMsg = matRes.status === 404 ? 'Material not found.' : 'Failed to load material.';
      loading = false;
      return;
    }

    const data = await matRes.json();
    content = data.content ?? '';
    renderedHtml = DOMPurify.sanitize(await marked.parse(content));
    loading = false;
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <BackLink href={resolve('/training')} label="Back to training materials" />

    {#if userRole === 'admin'}
      <a
        href={resolve(`/admin/training/${slug}/edit`)}
        class="text-sm font-medium hover:text-foreground text-muted-foreground"
      >Edit</a>
    {/if}
  </div>

  {#if errorMsg}
    <Alert variant="destructive">
      <WarningCircleIcon />
      <AlertDescription>{errorMsg}</AlertDescription>
    </Alert>
  {/if}

  {#if loading}
    <div class="space-y-4 animate-pulse">
      <div class="h-8 w-64 rounded bg-muted"></div>
      <div class="space-y-2">
        {#each Array(6) as _}
          <div class="h-4 rounded bg-muted/50"></div>
        {/each}
      </div>
    </div>
  {:else if renderedHtml}
    <Card>
      <CardContent class="pt-6">
        <div class="prose prose-sm dark:prose-invert max-w-none">
          {@html renderedHtml}
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
