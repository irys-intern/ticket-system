<script lang="ts">
    import { page } from '$app/state';
    import { resolve } from '$app/paths';
    import type { Ticket } from '../../../types/index.ts';
    import { onMount } from 'svelte';
    const {data} = $props();
    let user = $derived(data.user);
    let ticket: Ticket | null = $state(null);
    let loading = $state(true);
    let error: string | null = $state(null);
    let assignmentStringState = $state("")
    let agents: Array<{id:string; name:string; role:string}> = $state([]);
    let selectedAgentId = $state("");
    let showAssignModal = $state(false);

    onMount(async () => {
        try {
            const id = page.params.id;
            const response = await fetch(`/tickets/${id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch ticket');
            }
            ticket = await response.json();
            if (user.role === 'admin') {
                assignmentStringState = await assignmentString(ticket?.assignedTo);
                await loadAgents();
            }
        } catch (err) {
            error = err instanceof Error ? err.message : 'An error occurred';
        } finally {
            loading = false;
        }
    })

    async function loadAgents() {
        try {
            const response = await fetch('/admin/users');
            if (!response.ok) {
                throw new Error('Failed to load agents');
            }
            const allUsers = await response.json();
            const users = allUsers.users ?? [];
            agents = users.filter((u: {id: string, role: string, name: string}) => u.role === 'agent');
            selectedAgentId = agents[0]?.id ?? "";
        } catch (err) {
            console.error(err);
        }
    }

    function openAssignModal() {
        showAssignModal = true;
        if (!selectedAgentId && agents.length > 0) {
            selectedAgentId = agents[0].id;
            console.log(selectedAgentId)
        }
    }

    function closeAssignModal() {
        showAssignModal = false;
    }

    async function assignSelectedAgent() {
        if (!ticket || !selectedAgentId) return;
        if (ticket.assignedTo === selectedAgentId) return;
        if (parseInt(selectedAgentId) === -1) {
            console.log(
                (await fetch(window.location.href, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ticketId: ticket.id, action: 'unassign'})
        })).json());
        } else {
            console.log(
                (await fetch(window.location.href, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({agent: selectedAgentId, ticketId: ticket.id, action: 'assign'})
            })).json()
        )
        }
        window.location.reload();
    }

    async function claimTicket() {
        await fetch(window.location.href, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({agent: user.userId, ticketId: ticket?.id, action: 'claim'})
        });
        window.location.reload()
    }

    async function forfeitTicket() {
        await fetch(window.location.href, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({agent: user.userId, ticketId: ticket?.id, action: 'forfeit'})
        });
        window.location.reload()
    }

    async function assignmentString(userId: string|undefined) {
        if (!userId) {
            console.log("No userId")
            return ""
        }
        const res = await fetch(`/admin/users/${userId}`);
        const resp = await res.json();
        return `${resp.user.name} (${userId})`
    }
    async function closeTicketUser() {
        if (confirm("Are you sure you want to close this ticket?")) {
            const res = await fetch(window.location.href, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ticketId: ticket?.id, action: 'close'})
            })
            if (res.ok) {
                window.location.reload()
            }
        }
    }
    async function closeTicketAgent() {
        if (confirm("Are you sure you want to close this ticket?")) {
            const reason = prompt("Please provide a closing message.", )
            if (!reason || reason==='') return
            await fetch(window.location.href+"/comments", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ticketId: ticket?.id, comment: reason})
            })
            const res = await fetch(window.location.href, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ticketId: ticket?.id, action: 'close'})
            })
            if (res.ok) {
                window.location.reload()
            }
        }
    }
    async function closeTicketAdmin() {
        if (confirm("Are you sure you want to close this ticket?")) {
            const reason = prompt("Please provide a closing message.", )
            if (!reason || reason==='') return
            await fetch(window.location.href+"/comments", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ticketId: ticket?.id, comment: reason})
            })
            const res = await fetch(window.location.href, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ticketId: ticket?.id, action: 'close'})
            })
            if (res.ok) {
                window.location.reload()
            }
        }
    }
</script>
<div class="card">
    {#if user.role === 'agent'||user.role === 'admin'}
        <a href={resolve('/tickets/open',{})}>Open tickets</a><br>
    {/if}
    <a href={resolve('/', {})}>Return home</a>
    {#if loading}
        <p>Loading...</p>
    {:else if error}
        <p style="color: red;">Error: {error}</p>
    {:else if ticket}
        <h1>Ticket #{ticket.id}</h1>
        <p><strong>Category:</strong> {ticket.category.replace('_', ' ')}</p>
        <p><strong>Title:</strong> {ticket.title}</p>
        <p><strong>Priority:</strong> {ticket.priority}</p>
        <p><strong>Description:</strong> {ticket.description}</p>
        <p><strong>Status:</strong> {ticket.status}</p><br>
        {#if user.role === 'agent'}
        {#if ticket.assignedTo && (parseInt(user.userId) === parseInt(ticket.assignedTo))}
        <button onclick={() => window.location.href=window.location.href+"/comments"}>Open Comments</button>
        <button>Update Status</button>
        <button class="danger" onclick={forfeitTicket}>Forfeit ticket</button>
        <button class="danger" onclick={closeTicketAgent}>Close ticket</button>
        {:else if ticket.assignedTo === '' || !ticket.assignedTo}
        <button onclick={claimTicket}>Claim ticket</button>
        {/if}
        {:else if user.role === 'user'}
        <button onclick={() => window.location.href=window.location.href+"/comments"}>Open Comments</button>
        {#if !(ticket.status === 'closed')}
        <button class="danger" onclick={closeTicketUser}>Close ticket</button>
        {/if}
        {:else if user.role === 'admin'}
        {#if ticket.assignedTo}
        <p><strong>Assigned to:</strong> {assignmentStringState}</p>
        {/if}
        <button onclick={() => window.location.href=window.location.href+"/comments"}>Open Comments</button>
        {#if !(ticket.status === 'closed')}
                <button onclick={openAssignModal}>Assign agent</button>
                <button class="danger" onclick={closeTicketAdmin}>Close ticket</button>
            {/if}
            {#if showAssignModal}
                <div class="modal">
                    <div class="modal-content">
                        <h2>Assign agent</h2>
                        {#if agents.length > 0}
                            <label>
                                Select agent:
                                <select bind:value={selectedAgentId}>
                                    <option value=-1>Unassign</option>
                                    {#each agents as agent (agent.id)}
                                        <option value={agent.id}>{agent.name} ({agent.id})</option>
                                    {/each}
                                </select>
                            </label>
                            <button onclick={assignSelectedAgent}>Assign</button>
                        {:else}
                            <p>No agents available</p>
                        {/if}
                        <button onclick={closeAssignModal}>Cancel</button>
                    </div>
                </div>
            {/if}
        {/if}
    {:else}
        <p>Ticket not found</p>
    {/if}
</div>