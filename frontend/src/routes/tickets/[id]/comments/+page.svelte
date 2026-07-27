<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
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
  import RobotIcon from 'phosphor-svelte/lib/RobotIcon';
  import { fly } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let comments = $derived(data.comments);
  let error = $derived(data.error);
  let awaitingResponse = $derived(data.awaitingResponse);
  let isClosed = $derived(data.isClosed);
  let ticketUrl = $derived(resolve('/tickets/[id]', { id: data.ticketId }));

  let newComment = $state('');
  let posting = $state(false);

  let reversedComments = $derived([...comments].reverse());

  async function postComment() {
    if (!newComment.trim()) return;
    posting = true;
    try {
      const response = await fetch(PUBLIC_BACKEND_URL + window.location.pathname, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newComment }),
      });
      if (!response.ok) throw new Error('Failed to post comment. Ensure the ticket is open and you are logged in.');
      newComment = '';
      await invalidateAll();
      toast.success('Comment posted.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      posting = false;
    }
  }
</script>

<title>Comments for Ticket</title>

<div class="flex flex-col space-y-4">
  <div class="shrink-0">
    <BackLink href={ticketUrl} label="Back to ticket" />
  </div>

  <div class="shrink-0">
    <h1 class="text-2xl font-bold tracking-tight">Comments</h1>
    <p class="text-sm text-muted-foreground">Discussion history for this ticket.</p>
  </div>

  {#if error}
    <Alert variant="destructive" class="shrink-0">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  {/if}

  {#if awaitingResponse}
    <div class="flex shrink-0 gap-2.5 rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm">
      <WarningIcon class="size-4 shrink-0 translate-y-0.5 text-yellow-600 dark:text-yellow-400" />
      <div>
        <p class="font-medium text-yellow-700 dark:text-yellow-400">The agent is waiting for your response.</p>
        <p class="text-muted-foreground mt-0.5">Posting a comment will move this ticket back to in progress.</p>
      </div>
    </div>
  {/if}
  {#if !isClosed}
    <div class="shrink-0 space-y-2">
      <Textarea
        bind:value={newComment}
        placeholder="Write a comment…"
        rows={4}
        disabled={posting}
      />
      <Button class="cursor-pointer" onclick={postComment} disabled={!newComment.trim() || posting}>
        <PaperPlaneTiltIcon /> Post Comment
      </Button>
    </div>
  {:else}
    <Alert class="shrink-0">
      <AlertDescription>This ticket is closed. No new comments can be posted.</AlertDescription>
    </Alert>
  {/if}

  <Separator class="shrink-0" />

  {#if !comments || comments.length === 0}
    <p class="shrink-0 text-sm text-muted-foreground">No comments yet.</p>
  {:else}
    <div class="relative">
      <div class="-mt-1 -mr-1 -ml-1 max-h-[50vh] space-y-2 overflow-y-auto pt-1 pr-1 pb-4 pl-1">
        {#each reversedComments as comment (comment.id)}
          <div animate:flip={{ duration: 200 }} transition:fly={{ y: -8, duration: 200 }}>
            {#if comment.isAutomated}
              <div class="flex items-center justify-center gap-1.5 py-1 text-xs text-muted-foreground">
                <RobotIcon class="size-3.5 shrink-0" />
                <span>{comment.content}</span>
                <span aria-hidden="true">·</span>
                <span>{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
            {:else}
              <Card class="py-3">
                <CardHeader class="px-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-semibold">{comment.userName}</span>
                    <span class="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                </CardHeader>
                <CardContent class="px-3 pt-0">
                  <p class="text-sm">{comment.content}</p>
                </CardContent>
              </Card>
            {/if}
          </div>
        {/each}
      </div>
      <div
        class="pointer-events-none absolute right-3 bottom-0 left-0 h-8 bg-linear-to-t from-background to-transparent"
      ></div>
    </div>
  {/if}
</div>
