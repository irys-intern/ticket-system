<title>Comments for Ticket</title>
<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Separator } from '$lib/components/ui/separator';
  import { PUBLIC_BACKEND_URL } from '$env/static/public'
  import { toast } from '$lib/toast';
  import BackLink from '$lib/components/BackLink.svelte';
  import PaperPlaneTiltIcon from 'phosphor-svelte/lib/PaperPlaneTiltIcon';
  import WarningIcon from 'phosphor-svelte/lib/WarningIcon';

  let comments: { id: string; userName: string; createdAt: string; content: string }[] = $state([]);
  let newComment = $state('');
  let loading = $state(true);
  let error: string | null = $state(null);
  let ticketUrl = $state('');
  let awaitingResponse = $state(false);

  let reversedComments = $derived([...comments].reverse());

  onMount(async () => {
    const locationURL = new URL(window.location.href).pathname;
    const parts = locationURL.split('/');
    ticketUrl = parts.slice(0, parts.length - 1).join('/');

    const [, meRes, ticketRes] = await Promise.all([
      fetchComments(),
      fetch(PUBLIC_BACKEND_URL + '/auth/me', { credentials: 'include' }),
      fetch(PUBLIC_BACKEND_URL + ticketUrl, { credentials: 'include' }),
    ]);

    if (meRes.ok && ticketRes.ok) {
      const meData = await meRes.json();
      const ticketData = await ticketRes.json();
      const role = meData.session?.role;
      const status = ticketData.status;
      awaitingResponse = role === 'user' && status === 'waiting_for_response';
    }
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
      const data = await response.json();
      if (data.resumedTicket) awaitingResponse = false;
      newComment = '';
      await fetchComments();
      toast.success('Comment posted.');
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      toast.error(error);
    }
  }
</script>

<div class="space-y-4">
  <div>
    <BackLink href={ticketUrl} label="Back to ticket" />
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
      {#each reversedComments as comment (comment.id)}
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

  {#if awaitingResponse}
    <div class="flex gap-2.5 rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm">
      <WarningIcon class="size-4 shrink-0 translate-y-0.5 text-yellow-600 dark:text-yellow-400" />
      <div>
        <p class="font-medium text-yellow-700 dark:text-yellow-400">The agent is waiting for your response.</p>
        <p class="text-muted-foreground mt-0.5">Posting a comment will move this ticket back to in progress.</p>
      </div>
    </div>
  {/if}

  <div class="space-y-2">
    <Textarea
      bind:value={newComment}
      placeholder="Write a comment…"
      rows={4}
      disabled={loading}
    />
    <Button class="cursor-pointer" onclick={postComment} disabled={!newComment.trim() || loading}>
      <PaperPlaneTiltIcon /> Post Comment
    </Button>
  </div>
</div>
