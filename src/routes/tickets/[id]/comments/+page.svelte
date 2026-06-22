<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Separator } from '$lib/components/ui/separator';

  let comments: { id: string; userName: string; createdAt: string; content: string }[] = $state([]);
  let newComment = $state('');
  let loading = $state(true);
  let error: string | null = $state(null);
  let ticketUrl = $state('');

  onMount(async () => {
    await fetchComments();
    const locationURL = new URL(window.location.href).pathname;
    const parts = locationURL.split('/');
    ticketUrl = parts.slice(0, parts.length - 1).join('/');
  });

  async function fetchComments() {
    try {
      loading = true;
      const response = await fetch(location.href);
      if (!response.ok) throw new Error('Failed to fetch comments. Please reload.');
      const data = await response.json();
      comments = data.comments || [];
      error = null;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      loading = false;
    }
  }

  async function postComment() {
    if (!newComment.trim()) return;
    try {
      const response = await fetch(location.href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });
      if (!response.ok) throw new Error('Failed to post comment. Ensure the ticket is open and you are logged in.');
      newComment = '';
      await fetchComments();
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  }
</script>

<div class="space-y-4">
  <div>
    <a href={resolve('/' + ticketUrl, {})} class="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
      &larr; Back to ticket
    </a>
  </div>

  <h1 class="text-2xl font-bold tracking-tight">Comments</h1>

  {#if error}
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  {/if}

  {#if loading}
    <p class="text-muted-foreground text-sm">Loading comments…</p>
  {:else if !comments || comments.length === 0}
    <p class="text-muted-foreground text-sm">No comments yet.</p>
  {:else}
    <div class="space-y-3">
      {#each comments as comment (comment.id)}
        <Card>
          <CardHeader class="pb-1 pt-4 px-4">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-sm">{comment.userName}</span>
              <span class="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</span>
            </div>
          </CardHeader>
          <CardContent class="px-4 pb-4 pt-1">
            <p class="text-sm">{comment.content}</p>
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}

  <Separator />

  <div class="space-y-2">
    <Textarea
      bind:value={newComment}
      placeholder="Write a comment…"
      rows={4}
      disabled={loading}
    />
    <Button onclick={postComment} disabled={!newComment.trim() || loading}>
      Post Comment
    </Button>
  </div>
</div>
