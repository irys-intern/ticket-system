<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

  let title = $state('');
  let description = $state('');
  let category = $state('bug');
  let priority = $state('low');
  let successMessage = $state('');
  let errors: string[] = $state([]);

  onMount(() => {
    document.title = 'Create Ticket';
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();
    errors = [];
    const response = await fetch('/create_ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    <a href={resolve('/', {})} class="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">&larr; Return home</a>
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
          <Textarea id="description" rows={4} bind:value={description} required />
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
        </div>

        <Button type="submit">Submit Ticket</Button>
      </form>
    </CardContent>
  </Card>
</div>
