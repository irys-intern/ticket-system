<script lang="ts">
  import { resolve } from '$app/paths';
  import { invalidateAll } from '$app/navigation';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import BackLink from '$lib/components/BackLink.svelte';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import SystemHealthWidget from '$lib/components/SystemHealthWidget.svelte';
  import { toast } from '$lib/toast';
  import FloppyDiskIcon from 'phosphor-svelte/lib/FloppyDiskIcon';
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
  import { untrack } from 'svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let siteIconUrl = $state(untrack(() => data.settings.siteIconUrl));
  let nlpDebounceMs = $state(untrack(() => data.settings.nlpDebounceMs));
  let dashboardCacheTtlSeconds = $state(untrack(() => data.settings.dashboardCacheTtlSeconds));
  let saving = $state(false);

  async function handleSave() {
    saving = true;
    try {
      const response = await fetch(PUBLIC_BACKEND_URL + '/admin/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteIconUrl, nlpDebounceMs, dashboardCacheTtlSeconds }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(result.message ?? 'Unable to update settings');
        return;
      }
      toast.success('Settings saved.');
      await invalidateAll();
    } finally {
      saving = false;
    }
  }
</script>

<title>App Settings</title>

<div class="space-y-4">
  <div>
    <BackLink href={resolve('/')} />
  </div>

  <div>
    <h1 class="text-2xl font-bold tracking-tight">App Settings</h1>
    <p class="text-sm text-muted-foreground">Tune runtime behavior without a deploy.</p>
  </div>

  {#if data.error}
    <Alert variant="destructive">
      <WarningCircleIcon />
      <AlertDescription>{data.error}</AlertDescription>
    </Alert>
  {/if}

  <Card>
    <CardHeader>
      <CardTitle>System Health</CardTitle>
    </CardHeader>
    <CardContent>
      <SystemHealthWidget />
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Branding</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3">
      <div class="space-y-1.5">
        <Label for="site-icon-url">Site icon URL</Label>
        <div class="flex items-center gap-3">
          <img src={siteIconUrl} alt="Site icon preview" class="size-8 shrink-0 rounded" />
          <Input id="site-icon-url" type="text" bind:value={siteIconUrl} class="flex-1" />
        </div>
        <p class="text-xs text-muted-foreground">
          Shown in the header next to "Ticket System" for every visitor, including guests.
        </p>
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>NLP Priority Suggestions</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3">
      <div class="space-y-1.5">
        <Label for="nlp-debounce">Typing debounce (ms)</Label>
        <Input
          id="nlp-debounce"
          type="number"
          min="0"
          max="10000"
          step="50"
          bind:value={nlpDebounceMs}
          class="max-w-40"
        />
        <p class="text-xs text-muted-foreground">
          How long a user must pause typing a ticket description before the NLP service is asked to
          suggest a priority. Lower values feel more responsive but call the NLP service more often.
        </p>
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Dashboard Caching</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3">
      <div class="space-y-1.5">
        <Label for="cache-ttl">Cache TTL (seconds)</Label>
        <Input
          id="cache-ttl"
          type="number"
          min="1"
          max="3600"
          bind:value={dashboardCacheTtlSeconds}
          class="max-w-40"
        />
        <p class="text-xs text-muted-foreground">
          How long ticket lists, user lists, the audit log, and homepage stats are cached in Redis
          before being refreshed from the database. Lower values show fresher data sooner; higher
          values reduce database load.
        </p>
      </div>
    </CardContent>
  </Card>

  <div class="flex justify-end">
    <Button onclick={handleSave} disabled={saving}>
      <FloppyDiskIcon /> {saving ? 'Saving…' : 'Save Settings'}
    </Button>
  </div>
</div>
