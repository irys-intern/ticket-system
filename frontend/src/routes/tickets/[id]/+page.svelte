<script lang="ts">
  import { resolve } from '$app/paths';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import BackLink from '$lib/components/BackLink.svelte';
  import PriorityBadge from '$lib/components/PriorityBadge.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from '$lib/components/ui/dialog';
  import { Label } from '$lib/components/ui/label';
  import { Separator } from '$lib/components/ui/separator';
  import { Textarea } from '$lib/components/ui/textarea';
  import { queueToast, toast } from '$lib/toast';
  import ChatCircleIcon from 'phosphor-svelte/lib/ChatCircleIcon';
  import CheckIcon from 'phosphor-svelte/lib/CheckIcon';
  import HandPalmIcon from 'phosphor-svelte/lib/HandPalmIcon';
  import UserSwitchIcon from 'phosphor-svelte/lib/UserSwitchIcon';
  import WarningIcon from 'phosphor-svelte/lib/WarningIcon';
  import XCircleIcon from 'phosphor-svelte/lib/XCircleIcon';
  import type { AuditEvent } from '../../../types/index.ts';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let user = $derived(data.user);
  let ticket = $derived(data.ticket);
  let error = $derived(data.error);
  let assignmentStringState = $derived(data.assignmentString);
  let authorString = $derived(data.authorString);
  let createdByLabel = $derived(authorString ? ` by ${authorString}` : '');
  let agents = $derived(data.agents);
  let selectedAgentId = $state('');
  let showAssignModal = $state(false);
  let auditTrail: AuditEvent[] = $derived(data.auditTrail);
  let showStatusDialog = $state(false);
  let pendingStatus = $state('');
  let showCloseDialog = $state(false);
  let closeMode: 'user' | 'agent' | 'admin' = $state('user');
  let closeReason = $state('');

  $effect(() => {
    if (agents.length > 0 && !selectedAgentId) selectedAgentId = agents[0].id;
  });

  // Visiting a ticket implicitly acknowledges any notifications about it --
  // re-runs on `ticket.id` so client-side navigation between tickets (without
  // a full reload) still clears the newly-visited ticket's notifications.
  $effect(() => {
    const id = ticket?.id;
    if (id == null) return;
    fetch(`${PUBLIC_BACKEND_URL}/notifications/read-by-ticket/${id}`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(() => window.dispatchEvent(new CustomEvent('notifications:refresh')))
      .catch(() => {});
  });

  async function assignSelectedAgent() {
    if (!ticket || !selectedAgentId) return;
    if (ticket.assignedTo === selectedAgentId) return;
    const action = parseInt(selectedAgentId) === -1 ? 'unassign' : 'assign';
    const body =
      action === 'unassign'
        ? { ticketId: ticket.id, action }
        : { agent: selectedAgentId, ticketId: ticket.id, action };
    const res = await fetch(PUBLIC_BACKEND_URL + window.location.pathname, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    queueToast(
      res.ok ? 'success' : 'error',
      res.ok ? 'Assignment updated.' : 'Failed to update assignment.'
    );
    window.location.reload();
  }

  async function claimTicket() {
    const res = await fetch(PUBLIC_BACKEND_URL + window.location.pathname, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: user?.userId, ticketId: ticket?.id, action: 'claim' }),
    });
    queueToast(
      res.ok ? 'success' : 'error',
      res.ok ? 'Ticket claimed.' : 'Failed to claim ticket.'
    );
    window.location.reload();
  }

  function requestStatusUpdate() {
    if (!ticket) return;
    const statuses = ['open', 'in_progress', 'waiting_for_response', 'resolved'];
    const newStatus = statuses[statuses.indexOf(ticket.status) + 1];
    if (!newStatus?.trim()) return;
    pendingStatus = newStatus.trim();
    showStatusDialog = true;
  }

  function requestStatusUpdateBack() {
    if (!ticket) return;
    pendingStatus = 'in_progress';
    showStatusDialog = true;
  }

  async function submitStatusUpdate() {
    showStatusDialog = false;
    if (!ticket || !pendingStatus) return;
    const res = await fetch(PUBLIC_BACKEND_URL + window.location.pathname, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent: user?.userId,
        ticketId: ticket.id,
        action: 'update_status',
        status: pendingStatus,
      }),
    });
    queueToast(
      res.ok ? 'success' : 'error',
      res.ok ? 'Status updated.' : 'Failed to update status.'
    );
    window.location.reload();
  }

  async function forfeitTicket() {
    const res = await fetch(PUBLIC_BACKEND_URL + window.location.pathname, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: user?.userId, ticketId: ticket?.id, action: 'forfeit' }),
    });
    queueToast(
      res.ok ? 'success' : 'error',
      res.ok ? 'Ticket forfeited.' : 'Failed to forfeit ticket.'
    );
    window.location.reload();
  }

  function requestClose(mode: 'user' | 'agent' | 'admin') {
    closeMode = mode;
    closeReason = '';
    showCloseDialog = true;
  }

  async function submitClose() {
    if (closeMode !== 'user' && !closeReason.trim()) return;
    showCloseDialog = false;

    if (closeMode !== 'user') {
      await fetch(PUBLIC_BACKEND_URL + window.location.pathname + '/comments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket?.id,
          content: `Ticket closed: ${closeReason.trim()}`,
        }),
      });
    }

    const res = await fetch(PUBLIC_BACKEND_URL + window.location.pathname, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        closeMode === 'agent'
          ? { agent: user?.userId, ticketId: ticket?.id, action: 'close' }
          : { ticketId: ticket?.id, action: 'close' }
      ),
    });
    if (res.ok) {
      queueToast('success', 'Ticket closed.');
      window.location.reload();
    } else {
      toast.error('Failed to close ticket.');
    }
  }

  const statusVariant = (s: string) =>
    s === 'closed' ? 'outline' : s === 'open' ? 'secondary' : 'default';

  const formatDateTime = (date: string | Date) =>
    new Date(date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  async function updateMetadata(field: 'priority' | 'category', value: string) {
    if (!ticket) return;
    const res = await fetch(PUBLIC_BACKEND_URL + window.location.pathname, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent: user?.userId,
        ticketId: ticket.id,
        action: 'update_metadata',
        [field]: value,
      }),
    });
    queueToast(
      res.ok ? 'success' : 'error',
      res.ok ? 'Ticket updated.' : 'Failed to update ticket.'
    );
    window.location.reload();
  }
</script>

<title>Ticket</title>

<div class="space-y-4">
  <div class="flex items-center gap-4 text-sm">
    <BackLink href={resolve('/tickets')} label="Back to tickets" />
  </div>

  {#if error}
    <p class="text-destructive">Error: {error}</p>
  {:else if ticket}
    <Card>
      <CardHeader>
        <div class="flex flex-wrap items-start justify-between gap-2">
          <CardTitle>Ticket #{ticket.id}: {ticket.title}</CardTitle>
          <div class="flex flex-wrap gap-1.5">
            <PriorityBadge priority={ticket.priority} />
            <Badge variant={statusVariant(ticket.status)}>{ticket.status.replace(/_/g, ' ')}</Badge>
            <Badge variant="outline">{ticket.category.replace(/_/g, ' ')}</Badge>
          </div>
        </div>
        <p class="text-xs text-muted-foreground">
          Created {formatDateTime(ticket.createdAt)}{createdByLabel}
          &middot; Updated {formatDateTime(ticket.updatedAt)}
        </p>
      </CardHeader>
      <CardContent class="space-y-3">
        <p class="text-sm text-muted-foreground">{ticket.description}</p>

        {#if ticket.assignedTo && assignmentStringState}
          <p class="text-sm">
            <span class="font-medium">Assigned to:</span>
            {assignmentStringState}
          </p>
        {/if}

        <Separator />

        {#if user.role === 'user' && ticket.status === 'waiting_for_response'}
          <div
            class="flex gap-2.5 rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm"
          >
            <WarningIcon
              class="size-4 shrink-0 translate-y-0.5 text-yellow-600 dark:text-yellow-400"
            />
            <div>
              <p class="font-medium text-yellow-700 dark:text-yellow-400">
                The agent is waiting for your response.
              </p>
              <p class="mt-0.5 text-muted-foreground">
                Reply in the comments to resume work on this ticket.
              </p>
            </div>
          </div>
        {/if}

        <div class="flex flex-wrap gap-2">
          <Button
            class="cursor-pointer"
            size="sm"
            onclick={() => (window.location.href = window.location.href + '/comments')}
          >
            <ChatCircleIcon /> Comments
          </Button>

          {#if user.role === 'agent'}
            {#if ticket.assignedTo && user.userId === ticket.assignedTo}
              {#if ticket.status !== 'resolved' && ticket.status !== 'closed'}
                <Button size="sm" variant="secondary" onclick={requestStatusUpdate}
                  ><CheckIcon /> Update Status</Button
                >
                {#if ticket.status === 'waiting_for_response'}
                  <Button size="sm" variant="secondary" onclick={requestStatusUpdateBack}
                    >Mark In Progress</Button
                  >
                {/if}
                <Button size="sm" variant="outline" onclick={forfeitTicket}
                  ><HandPalmIcon /> Forfeit</Button
                >
              {/if}
              {#if ticket.status !== 'closed'}
                <Button size="sm" variant="destructive" onclick={() => requestClose('agent')}
                  ><XCircleIcon /> Close Ticket</Button
                >
              {/if}
            {:else if (!ticket.assignedTo || ticket.assignedTo === '') && ticket.status !== 'closed'}
              <Button size="sm" onclick={claimTicket}>Claim Ticket</Button>
            {/if}

            {#if ticket.assignedTo && user.userId === ticket.assignedTo && ticket.status !== 'closed' && ticket.status !== 'resolved'}
              <div class="ml-auto flex gap-2">
                <select
                  value={ticket.priority}
                  onchange={(e) =>
                    updateMetadata('priority', (e.target as HTMLSelectElement).value)}
                  class="h-8 w-32 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <select
                  value={ticket.category}
                  onchange={(e) =>
                    updateMetadata('category', (e.target as HTMLSelectElement).value)}
                  class="h-8 w-40 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <option value="bug">Bug</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="support">Support</option>
                  <option value="other">Other</option>
                </select>
              </div>
            {/if}
          {:else if user.role === 'user'}
            {#if ticket.status !== 'closed'}
              <Button size="sm" variant="destructive" onclick={() => requestClose('user')}
                ><XCircleIcon /> Close Ticket</Button
              >
            {/if}
          {:else if user.role === 'admin'}
            {#if ticket.status !== 'closed'}
              <Button size="sm" variant="secondary" onclick={() => (showAssignModal = true)}
                ><UserSwitchIcon /> Assign Agent</Button
              >
              <Button size="sm" variant="destructive" onclick={() => requestClose('admin')}
                ><XCircleIcon /> Close Ticket</Button
              >
              <div class="ml-auto flex gap-2">
                <select
                  value={ticket.priority}
                  onchange={(e) =>
                    updateMetadata('priority', (e.target as HTMLSelectElement).value)}
                  class="h-8 w-32 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <select
                  value={ticket.category}
                  onchange={(e) =>
                    updateMetadata('category', (e.target as HTMLSelectElement).value)}
                  class="h-8 w-40 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <option value="bug">Bug</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="support">Support</option>
                  <option value="other">Other</option>
                </select>
              </div>
            {/if}
          {/if}
        </div>
      </CardContent>
    </Card>

    <!-- Assign agent dialog (admin only) -->
    <Dialog bind:open={showAssignModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Agent</DialogTitle>
        </DialogHeader>
        {#if agents.length > 0}
          <div class="space-y-2 py-2">
            <Label for="agent-select">Select agent</Label>
            <select
              id="agent-select"
              bind:value={selectedAgentId}
              class="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <option value="-1">Unassign</option>
              {#each agents as agent (agent.id)}
                <option value={agent.id}>{agent.name} ({agent.id})</option>
              {/each}
            </select>
          </div>
        {:else}
          <p class="py-2 text-sm text-muted-foreground">No agents available.</p>
        {/if}
        <DialogFooter>
          <Button variant="outline" onclick={() => (showAssignModal = false)}>Cancel</Button>
          {#if agents.length > 0}
            <Button onclick={assignSelectedAgent}>Assign</Button>
          {/if}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Status update confirmation dialog -->
    <Dialog bind:open={showStatusDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update status</DialogTitle>
          <DialogDescription>
            Update this ticket's status to "{pendingStatus}"?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onclick={() => (showStatusDialog = false)}>Cancel</Button>
          <Button onclick={submitStatusUpdate}>Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Close ticket confirmation dialog -->
    <Dialog bind:open={showCloseDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close ticket</DialogTitle>
          <DialogDescription>Are you sure you want to close this ticket?</DialogDescription>
        </DialogHeader>
        {#if closeMode !== 'user'}
          <div class="space-y-1.5 py-2">
            <Label for="close-reason">Closing message</Label>
            <Textarea
              id="close-reason"
              bind:value={closeReason}
              placeholder="Explain why this ticket is being closed…"
              rows={3}
            />
          </div>
        {/if}
        <DialogFooter>
          <Button variant="outline" onclick={() => (showCloseDialog = false)}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={closeMode !== 'user' && !closeReason.trim()}
            onclick={submitClose}
            ><XCircleIcon /> Close Ticket</Button
          >
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Audit trail -->
    {#if auditTrail.length > 0}
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="max-h-64 overflow-auto pr-2">
            <ul class="space-y-3">
              {#each auditTrail as audit, i (audit.id ?? i)}
                <li class="border-l-2 border-border pl-3 text-sm">
                  <p class="font-medium">{audit.action ?? 'Audit entry'}</p>
                  <p class="text-xs text-muted-foreground">
                    {audit.createdAt ? formatDateTime(audit.createdAt) : 'Unknown time'}
                    {#if audit.userId}&middot; {audit.userDisplay ?? audit.userId}{/if}
                  </p>
                </li>
              {/each}
            </ul>
          </div>
        </CardContent>
      </Card>
    {:else}
      <p class="text-sm text-muted-foreground">No audit history available.</p>
    {/if}
  {:else}
    <p class="text-muted-foreground">Ticket not found.</p>
  {/if}
</div>
