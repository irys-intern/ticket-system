<script lang="ts">
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { toast } from '$lib/toast';
  import ArrowClockwiseIcon from 'phosphor-svelte/lib/ArrowClockwiseIcon';
  import BroomIcon from 'phosphor-svelte/lib/BroomIcon';
  import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircleIcon';
  import XCircleIcon from 'phosphor-svelte/lib/XCircleIcon';
  import { onDestroy, onMount } from 'svelte';

  type HealthCheck = { service: string; status: 'ok' | 'error'; latencyMs?: number; message?: string };

  let checks: HealthCheck[] = $state([]);
  let loading = $state(true);
  let flushing = $state(false);
  let lastChecked: Date | null = $state(null);

  const SERVICE_LABELS: Record<string, string> = {
    database: 'Database',
    redis: 'Redis',
    nlp_service: 'NLP Service',
  };

  async function loadHealth() {
    loading = true;
    try {
      const response = await fetch(PUBLIC_BACKEND_URL + '/admin/health', { credentials: 'include' });
      if (response.ok) {
        const result = await response.json();
        checks = result.checks;
        lastChecked = new Date();
      }
    } catch {
      // leave the last known state on screen rather than clearing it
    } finally {
      loading = false;
    }
  }

  async function flushCache() {
    flushing = true;
    try {
      const response = await fetch(PUBLIC_BACKEND_URL + '/admin/cache', {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(result.message ?? 'Unable to flush cache');
        return;
      }
      toast.success(`Cleared ${result.cleared} cache ${result.cleared === 1 ? 'entry' : 'entries'}.`);
    } finally {
      flushing = false;
    }
  }

  let interval: ReturnType<typeof setInterval>;
  onMount(() => {
    loadHealth();
    interval = setInterval(loadHealth, 30000);
  });
  onDestroy(() => clearInterval(interval));
</script>

<div class="space-y-3">
  <div class="flex flex-wrap items-center gap-2">
    {#each checks as check (check.service)}
      <Badge variant={check.status === 'ok' ? 'secondary' : 'destructive'} class="gap-1">
        {#if check.status === 'ok'}
          <CheckCircleIcon />
        {:else}
          <XCircleIcon />
        {/if}
        {SERVICE_LABELS[check.service] ?? check.service}
        {#if check.status === 'ok' && check.latencyMs !== undefined}
          <span class="text-muted-foreground">{check.latencyMs}ms</span>
        {/if}
      </Badge>
    {/each}
    {#if loading && checks.length === 0}
      <span class="text-sm text-muted-foreground">Checking system health…</span>
    {/if}
  </div>

  {#if checks.some((c) => c.status === 'error')}
    <ul class="space-y-0.5 text-xs text-destructive">
      {#each checks.filter((c) => c.status === 'error') as check (check.service)}
        <li>{SERVICE_LABELS[check.service] ?? check.service}: {check.message}</li>
      {/each}
    </ul>
  {/if}

  <div class="flex items-center justify-between gap-2">
    <p class="text-xs text-muted-foreground">
      {lastChecked ? `Last checked ${lastChecked.toLocaleTimeString()}` : ''}
    </p>
    <div class="flex items-center gap-1.5">
      <Button size="sm" variant="outline" onclick={loadHealth} disabled={loading}>
        <ArrowClockwiseIcon /> Refresh
      </Button>
      <Button size="sm" variant="outline" onclick={flushCache} disabled={flushing}>
        <BroomIcon /> {flushing ? 'Flushing…' : 'Flush Cache'}
      </Button>
    </div>
  </div>
</div>
