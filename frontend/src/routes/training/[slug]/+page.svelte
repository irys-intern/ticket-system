<title>Training Material</title>

<script lang="ts">
  import { resolve } from '$app/paths';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Card, CardContent } from '$lib/components/ui/card';
  import BackLink from '$lib/components/BackLink.svelte';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let userRole = $derived(data.userRole);
  let slug = $derived(data.slug);
  let errorMsg = $derived(data.errorMsg);
  let renderedHtml = $state('');
  let loading = $state(true);

  $effect(() => {
    if (!data.content) {
      loading = false;
      return;
    }
    (async () => {
      renderedHtml = DOMPurify.sanitize(await marked.parse(data.content));
      loading = false;
    })();
  });
</script>

<div class="space-y-4">
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
