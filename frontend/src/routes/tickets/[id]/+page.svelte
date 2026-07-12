<title>Ticket</title>
<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import type { AuditEvent, Ticket } from '../../../types/index.ts';
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import PriorityBadge from '$lib/components/PriorityBadge.svelte';
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '$lib/components/ui/dialog';
  import { Label } from '$lib/components/ui/label';
  import { Separator } from '$lib/components/ui/separator';
  import BackLink from '$lib/components/BackLink.svelte';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import { toast, queueToast } from '$lib/toast';
  import ChatCircleIcon from 'phosphor-svelte/lib/ChatCircleIcon';
  import CheckIcon from 'phosphor-svelte/lib/CheckIcon';
  import HandPalmIcon from 'phosphor-svelte/lib/HandPalmIcon';
  import XCircleIcon from 'phosphor-svelte/lib/XCircleIcon';
  import UserSwitchIcon from 'phosphor-svelte/lib/UserSwitchIcon';
  import WarningIcon from 'phosphor-svelte/lib/WarningIcon';

  let user: { userId: string; email: string; name: string; role: string } | null = $state(null);
  let ticket: Ticket | null = $state(null);
  let loading = $state(true);
  let error: string | null = $state(null);
  let assignmentStringState = $state('');
  let agents: Array<{ id: string; name: string; role: string }> = $state([]);
  let selectedAgentId = $state('');
  let showAssignModal = $state(false);
  let auditTrail: AuditEvent[] = $state([]);
  let loadingAuditTrail = $state(true);

  onMount(async () => {
    const meRes = await fetch(PUBLIC_BACKEND_URL + '/auth/me', { credentials: 'include' });
    if (!meRes.ok) { window.location.href = '/auth/login'; return; }
    const meData = await meRes.json();
    if (!meData.valid || !meData.session?.userId) { window.location.href = '/auth/login'; return; }
    user = meData.session;

    try {
      const id = page.params.id;
      const response = await fetch(PUBLIC_BACKEND_URL+`/tickets/${id}`, {credentials: 'include'});
      if (!response.ok) throw new Error('Failed to fetch ticket');
      ticket = await response.json();

      if (ticket?.assignedTo) {
        assignmentStringState = await assignmentString(ticket.assignedTo);
      }
      if (user?.role === 'admin') {
        await loadAgents();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      loading = false;
    }

    loadAuditTrail();
  });

  async function loadAuditTrail() {
    const id = page.params.id;
    try {
      const headers = id ? { 'X-Ticket-Id': String(id) } : undefined;
      const audits = await fetch(PUBLIC_BACKEND_URL + '/admin/audit', { method: 'GET', headers, credentials: 'include' });
      if (audits.ok) {
        auditTrail = (await audits.json()).audits || [];
        for (const entry of auditTrail) {
          if (entry?.userId) {
            try {
              const r = await fetch(PUBLIC_BACKEND_URL+`/admin/users/${entry.userId}`, {credentials: 'include'});
              if (r.ok) {
                const j = await r.json();
                entry.userDisplay = `${j.user?.name ?? j.user?.username ?? 'User'} (${entry.userId})`;
              }
            } catch (e) {
              console.log(e);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      loadingAuditTrail = false;
    }
  }

  async function loadAgents() {
    try {
      const response = await fetch(PUBLIC_BACKEND_URL+'/admin/users', {credentials: 'include'});
      if (!response.ok) throw new Error('Failed to load agents');
      const allUsers = await response.json();
      const users = allUsers.users ?? [];
      agents = users.filter((u: { id: string; role: string; name: string }) => u.role === 'agent');
      selectedAgentId = agents[0]?.id ?? '';
    } catch (err) {
      console.error(err);
    }
  }

  async function assignSelectedAgent() {
    if (!ticket || !selectedAgentId) return;
    if (ticket.assignedTo === selectedAgentId) return;
    const action = parseInt(selectedAgentId) === -1 ? 'unassign' : 'assign';
    const body = action === 'unassign'
      ? { ticketId: ticket.id, action }
      : { agent: selectedAgentId, ticketId: ticket.id, action };
    const res = await fetch(PUBLIC_BACKEND_URL+window.location.pathname, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include'
    });
    queueToast(res.ok ? 'success' : 'error', res.ok ? 'Assignment updated.' : 'Failed to update assignment.');
    window.location.reload();
  }

  async function claimTicket() {
    const res = await fetch(PUBLIC_BACKEND_URL+window.location.pathname, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: user?.userId, ticketId: ticket?.id, action: 'claim' }),
    });
    queueToast(res.ok ? 'success' : 'error', res.ok ? 'Ticket claimed.' : 'Failed to claim ticket.');
    window.location.reload();
  }

  async function updateStatus() {
    if (!ticket) return;
    const statuses = ['open', 'in_progress', 'waiting_for_response', 'resolved'];
    const newStatus = statuses[statuses.indexOf(ticket.status) + 1];
    if (!newStatus?.trim()) return;
    if (!confirm(`Update this ticket's status to "${newStatus}"?`)) return;
    const res = await fetch(PUBLIC_BACKEND_URL+window.location.pathname, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: user?.userId, ticketId: ticket.id, action: 'update_status', status: newStatus.trim() }),
    });
    queueToast(res.ok ? 'success' : 'error', res.ok ? 'Status updated.' : 'Failed to update status.');
    window.location.reload();
  }

  async function updateStatusBack() {
    if (!ticket) return;
    if (!confirm(`Update this ticket's status to "in_progress"?`)) return;
    const res = await fetch(PUBLIC_BACKEND_URL+window.location.pathname, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: user?.userId, ticketId: ticket.id, action: 'update_status', status: 'in_progress' }),
    });
    queueToast(res.ok ? 'success' : 'error', res.ok ? 'Status updated.' : 'Failed to update status.');
    window.location.reload();
  }

  async function forfeitTicket() {
    const res = await fetch(PUBLIC_BACKEND_URL+window.location.pathname, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: user?.userId, ticketId: ticket?.id, action: 'forfeit' }),
    });
    queueToast(res.ok ? 'success' : 'error', res.ok ? 'Ticket forfeited.' : 'Failed to forfeit ticket.');
    window.location.reload();
  }

  async function assignmentString(userId: string | undefined) {
    if (!userId) return '';
    const res = await fetch(PUBLIC_BACKEND_URL+`/admin/users/${userId}`, {credentials: 'include'});
    const resp = await res.json();
    return `${resp.user.name} (${userId})`;
  }

  async function closeTicketUser() {
    if (confirm('Are you sure you want to close this ticket?')) {
      const res = await fetch(PUBLIC_BACKEND_URL+window.location.pathname, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket?.id, action: 'close' }),
      });
      if (res.ok) {
        queueToast('success', 'Ticket closed.');
        window.location.reload();
      } else {
        toast.error('Failed to close ticket.');
      }
    }
  }

  async function closeTicketAgent() {
    if (confirm('Are you sure you want to close this ticket?')) {
      const reason = prompt('Please provide a closing message.');
      if (!reason || reason === '') return;
      await fetch(PUBLIC_BACKEND_URL+window.location.pathname + '/comments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket?.id, content: `Ticket closed: ${reason}` }),
      });
      const res = await fetch(PUBLIC_BACKEND_URL+window.location.pathname, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: user?.userId, ticketId: ticket?.id, action: 'close' }),
      });
      if (res.ok) {
        queueToast('success', 'Ticket closed.');
        window.location.reload();
      } else {
        toast.error('Failed to close ticket.');
      }
    }
  }

  async function closeTicketAdmin() {
    if (confirm('Are you sure you want to close this ticket?')) {
      const reason = prompt('Please provide a closing message.');
      if (!reason || reason === '') return;
      await fetch(PUBLIC_BACKEND_URL+window.location.pathname + '/comments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket?.id, content: `Ticket closed: ${reason}` }),
      });
      const res = await fetch(PUBLIC_BACKEND_URL+window.location.pathname, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket?.id, action: 'close' }),
      });
      if (res.ok) {
        queueToast('success', 'Ticket closed.');
        window.location.reload();
      } else {
        toast.error('Failed to close ticket.');
      }
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
      body: JSON.stringify({ agent: user?.userId, ticketId: ticket.id, action: 'update_metadata', [field]: value }),
    });
    queueToast(res.ok ? 'success' : 'error', res.ok ? 'Ticket updated.' : 'Failed to update ticket.');
    window.location.reload();
  }
</script>

{#if user}
<div class="space-y-4">
  <div class="flex items-center gap-4 text-sm">
    <BackLink href={resolve('/')} />
    {#if user.role === 'agent' || user.role === 'admin'}
      <a href={resolve('/tickets/open')} class="text-muted-foreground hover:text-foreground">Open tickets</a>
    {/if}
  </div>

  {#if loading}
    <p class="text-muted-foreground">Loading…</p>
  {:else if error}
    <p class="text-destructive">Error: {error}</p>
  {:else if ticket}
    <Card>
      <CardHeader>
        <div class="flex items-start justify-between gap-2 flex-wrap">
          <CardTitle>Ticket #{ticket.id}: {ticket.title}</CardTitle>
          <div class="flex gap-1.5 flex-wrap">
            <PriorityBadge priority={ticket.priority} />
            <Badge variant={statusVariant(ticket.status)}>{ticket.status.replace(/_/g, ' ')}</Badge>
            <Badge variant="outline">{ticket.category.replace(/_/g, ' ')}</Badge>
          </div>
        </div>
        <p class="text-xs text-muted-foreground">
          Created {formatDateTime(ticket.createdAt)} &middot; Updated {formatDateTime(ticket.updatedAt)}
        </p>
      </CardHeader>
      <CardContent class="space-y-3">
        <p class="text-sm text-muted-foreground">{ticket.description}</p>

        {#if ticket.assignedTo && assignmentStringState}
          <p class="text-sm"><span class="font-medium">Assigned to:</span> {assignmentStringState}</p>
        {/if}

        <Separator />

        {#if user.role === 'user' && ticket.status === 'waiting_for_response'}
          <div class="flex gap-2.5 rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm">
            <WarningIcon class="size-4 shrink-0 translate-y-0.5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p class="font-medium text-yellow-700 dark:text-yellow-400">The agent is waiting for your response.</p>
              <p class="text-muted-foreground mt-0.5">Reply in the comments to resume work on this ticket.</p>
            </div>
          </div>
        {/if}

        <div class="flex flex-wrap gap-2">
          <Button class="cursor-pointer" size="sm" onclick={() => (window.location.href = window.location.href + '/comments')}>
            <ChatCircleIcon /> Comments
          </Button>

          {#if user.role === 'agent'}
            {#if ticket.assignedTo && user.userId === ticket.assignedTo}
              {#if ticket.status !== 'resolved' && ticket.status !== 'closed'}
                <Button size="sm" variant="secondary" onclick={updateStatus}><CheckIcon /> Update Status</Button>
                {#if ticket.status === 'waiting_for_response'}
                  <Button size="sm" variant="secondary" onclick={updateStatusBack}>Mark In Progress</Button>
                {/if}
                <Button size="sm" variant="outline" onclick={forfeitTicket}><HandPalmIcon /> Forfeit</Button>
              {/if}
              {#if ticket.status !== 'closed'}
                <Button size="sm" variant="destructive" onclick={closeTicketAgent}><XCircleIcon /> Close Ticket</Button>
              {/if}
            {:else if (!ticket.assignedTo || ticket.assignedTo === '') && ticket.status !== 'closed'}
              <Button size="sm" onclick={claimTicket}>Claim Ticket</Button>
            {/if}

            {#if ticket.assignedTo && user.userId === ticket.assignedTo && ticket.status !== 'closed' && ticket.status !== 'resolved'}
              <div class="ml-auto flex gap-2">
                <select
                  value={ticket.priority}
                  onchange={(e) => updateMetadata('priority', (e.target as HTMLSelectElement).value)}
                  class="h-8 w-32 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <select
                  value={ticket.category}
                  onchange={(e) => updateMetadata('category', (e.target as HTMLSelectElement).value)}
                  class="h-8 w-40 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring"
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
              <Button size="sm" variant="destructive" onclick={closeTicketUser}><XCircleIcon /> Close Ticket</Button>
            {/if}

          {:else if user.role === 'admin'}
            {#if ticket.status !== 'closed'}
            <Button size="sm" variant="secondary" onclick={() => (showAssignModal = true)}><UserSwitchIcon /> Assign Agent</Button>
            <Button size="sm" variant="destructive" onclick={closeTicketAdmin}><XCircleIcon /> Close Ticket</Button>
            <div class="ml-auto flex gap-2">
              <select
                value={ticket.priority}
                onchange={(e) => updateMetadata('priority', (e.target as HTMLSelectElement).value)}
                class="h-8 w-32 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <select
                value={ticket.category}
                onchange={(e) => updateMetadata('category', (e.target as HTMLSelectElement).value)}
                class="h-8 w-40 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring"
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
            <select id="agent-select" bind:value={selectedAgentId}
              class="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring">
              <option value="-1">Unassign</option>
              {#each agents as agent (agent.id)}
                <option value={agent.id}>{agent.name} ({agent.id})</option>
              {/each}
            </select>
          </div>
        {:else}
          <p class="text-muted-foreground text-sm py-2">No agents available.</p>
        {/if}
        <DialogFooter>
          <Button variant="outline" onclick={() => (showAssignModal = false)}>Cancel</Button>
          {#if agents.length > 0}
            <Button onclick={assignSelectedAgent}>Assign</Button>
          {/if}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Audit trail -->
    {#if loadingAuditTrail}
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3 animate-pulse">
            <div class="h-12 rounded-md bg-muted/40"></div>
            <div class="h-12 rounded-md bg-muted/40"></div>
            <div class="h-12 rounded-md bg-muted/40"></div>
          </div>
        </CardContent>
      </Card>
    {:else if auditTrail.length > 0}
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="max-h-64 overflow-auto pr-2">
            <ul class="space-y-3">
              {#each auditTrail as audit, i (audit.id ?? i)}
                <li class="text-sm border-l-2 border-border pl-3">
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
      <p class="text-muted-foreground text-sm">No audit history available.</p>
    {/if}
  {:else}
    <p class="text-muted-foreground">Ticket not found.</p>
  {/if}
</div>
{/if}
