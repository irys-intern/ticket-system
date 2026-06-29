<title>Create Ticket</title>
<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { PUBLIC_BACKEND_URL, PUBLIC_NLP_SERVER_URL } from '$env/static/public';

  let title = $state('');
  let description = $state('');
  let category = $state('bug');
  let priority = $state('low');
  let successMessage = $state('');
  let errors: string[] = $state([]);

  let suggestedPriority = $state('');
  let suggestionScore = $state(0);
  let suggestionLoading = $state(false);
  let debounceTimer: ReturnType<typeof setTimeout>;
  
  const PRIORITY_LABELS: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };

  function onDescriptionInput() {
    clearTimeout(debounceTimer);
    suggestedPriority = '';
    if (description.length < 20) return;
    debounceTimer = setTimeout(fetchSuggestion, 600);
  }

  async function fetchSuggestion() {
    suggestionLoading = true;
    try {
      const res = await fetch(`${PUBLIC_NLP_SERVER_URL}/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: [title, description].filter(Boolean).join(' — ') }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.priority) {
        suggestedPriority = data.priority;
        suggestionScore = data.score;
        priority = data.priority;
      }
    } catch {
      // NLP service unavailable — user sets priority manually
    } finally {
      suggestionLoading = false;
    }
  }

  onMount(() => {
    document.title = 'Create Ticket';
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();
    errors = [];
    const response = await fetch(PUBLIC_BACKEND_URL+'/create_ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, description, category, priority }),
    });
    const result = await response.json();
    if (response.ok) {
      successMessage = 'Ticket created successfully!';
      title = '';
      description = '';
      category = 'bug';
      priority = 'low';
      location.href = `/tickets/${result.ticketId}`;
    } else {
      errors = result.errors ?? [result.message ?? 'Failed to create ticket. Please try again.'];
    }
  }
</script>

<div class="space-y-4">
  <div>
    <a href={resolve('/')} class="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">&larr; Return home</a>
  </div>

  <Card class="max-w-lg">
    <CardHeader>
      <CardTitle>Create Ticket</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      {#if successMessage}
        <Alert class="border-green-200 bg-green-50 text-green-800">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      {/if}

      {#if errors.length}
        <Alert variant="destructive">
          <AlertDescription>
            <ul class="list-disc list-inside space-y-1">
              {#each errors as error (error)}
                <li>{error}</li>
              {/each}
            </ul>
          </AlertDescription>
        </Alert>
      {/if}

      <form class="space-y-4" onsubmit={handleSubmit} autocomplete="off">
        <div class="space-y-1.5">
          <Label for="title">Title</Label>
          <Input id="title" type="text" bind:value={title} required />
        </div>

        <div class="space-y-1.5">
          <Label for="description">Description</Label>
          <Textarea id="description" rows={4} bind:value={description} oninput={onDescriptionInput} required />
        </div>

        <div class="space-y-1.5">
          <Label for="category">Category</Label>
          <select id="category" name="category" bind:value={category} required
            class="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50">
            <option value="bug">Bug Report</option>
            <option value="feature_request">Feature Request</option>
            <option value="support">Support</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div class="space-y-1.5">
          <Label for="priority">Priority</Label>
          <select id="priority" name="priority" bind:value={priority} required
            class="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          {#if suggestionLoading}
            <p class="text-xs text-muted-foreground">Analyzing severity…</p>
          {:else if suggestedPriority}
            <p class="text-xs text-muted-foreground">
              Suggested: <span class="font-medium text-foreground">{PRIORITY_LABELS[suggestedPriority]}</span>
              <span class="text-muted-foreground">({Math.round(suggestionScore * 100)}% confidence)</span>
              — you can change this.
            </p>
          {/if}
        </div>

        <Button type="submit">Submit Ticket</Button>
      </form>
    </CardContent>
  </Card>
</div>
