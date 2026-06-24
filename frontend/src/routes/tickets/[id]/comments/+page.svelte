<title>Comments for Ticket</title>
<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Separator } from '$lib/components/ui/separator';
  import { PUBLIC_BACKEND_URL } from '$env/static/public'

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
      const response = await fetch(PUBLIC_BACKEND_URL+window.location.pathname, { credentials: 'include' });
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
      const response = await fetch(PUBLIC_BACKEND_URL+window.location.pathname, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
    <a href={ticketUrl} class="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
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
    <div class="space-y-3">
      {#each Array(3).keys() as index (index)}
        <Card>
          <CardHeader class="pb-1 pt-4 px-4">
            <div class="flex items-center justify-between">
              <div class="h-4 w-24 rounded-md bg-muted/40"></div>
              <div class="h-3 w-20 rounded-md bg-muted/40"></div>
            </div>
          </CardHeader>
          <CardContent class="px-4 pb-4 pt-1 space-y-2">
            <div class="h-12 rounded-md bg-muted/40"></div>
            <div class="h-12 rounded-md bg-muted/40"></div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {:else if !comments || comments.length === 0}
    <p class="text-muted-foreground text-sm">No comments yet.</p>
  {:else}
    <div class="max-h-[60vh] overflow-y-auto space-y-3">
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
    <Button class="cursor-pointer" onclick={postComment} disabled={!newComment.trim() || loading}>
      Post Comment
    </Button>
  </div>
</div>
