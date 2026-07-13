<script lang="ts">
  import { resolve } from '$app/paths';
  import BackLink from '$lib/components/BackLink.svelte';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
  import BookOpenIcon from 'phosphor-svelte/lib/BookOpenIcon';
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let userRole = $derived(data.userRole);
  let materials = $derived(data.materials);
  let errorMsg = $derived(data.errorMsg);
</script>

<title>Training Materials</title>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <BackLink href={resolve('/')} />
    {#if userRole === 'admin'}
      <a
        href={resolve('/admin/training')}
        class="text-sm font-medium text-muted-foreground hover:text-foreground">Manage materials</a
      >
    {/if}
  </div>

  <div>
    <h1 class="text-2xl font-bold tracking-tight">Training Materials</h1>
    <p class="text-sm text-muted-foreground">
      Browse guides and resources to help you resolve tickets.
    </p>
  </div>

  {#if errorMsg}
    <Alert variant="destructive">
      <WarningCircleIcon />
      <AlertDescription>{errorMsg}</AlertDescription>
    </Alert>
  {/if}

  {#if materials.length === 0 && !errorMsg}
    <p class="text-sm text-muted-foreground">No training materials available yet.</p>
  {:else if materials.length > 0}
    <div class="space-y-4">
      {#each materials as m (m.slug)}
        <a href={resolve(`/training/${m.slug}`)} class="block">
          <Card class="cursor-pointer transition-colors hover:bg-muted/30">
            <CardHeader class="py-4">
              <CardTitle class="flex items-center gap-2 text-base">
                <BookOpenIcon class="size-4 text-primary" />
                {m.title}
              </CardTitle>
            </CardHeader>
          </Card>
        </a>
      {/each}
    </div>
  {/if}
</div>
