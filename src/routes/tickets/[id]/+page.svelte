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
    onMount(async () => {
        try {
            const id = page.params.id;
            const response = await fetch(`/tickets/${id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch ticket');
            }
            
            ticket = await response.json();
        } catch (err) {
            error = err instanceof Error ? err.message : 'An error occurred';
        } finally {
            loading = false;
        }
         
    })
    async function getTicket() {
        
    }
    
    getTicket();
</script>
<div class="card">
    <a href={resolve("/", {})}>Return home</a>
    {#if loading}
        <p>Loading...</p>
    {:else if error}
        <p style="color: red;">Error: {error}</p>
    {:else if ticket}
        <h1>Ticket #{ticket.id}</h1>
        <p><strong>Title:</strong> {ticket.title}</p>
        <p><strong>Description:</strong> {ticket.description}</p>
        <p><strong>Status:</strong> {ticket.status}</p><br>
        {#if user.role === 'agent'}
            {#if user.userId === ticket.assignedTo}
                <button>Update Status</button>
                <button>Write Comment</button>
                <button class="danger">Forfeit ticket</button>
                <button class="danger">Close ticket</button>
            {:else if ticket.assignedTo === '' || !ticket.assignedTo}
                <button>Claim ticket</button>
            {/if}
        {:else if user.role === 'user'}
            <button>Write comment</button>
            <button class="danger">Close ticket</button>
            {:else if user.role === 'admin'}
            <button>Assign agent</button>
            <button class="danger">Close ticket</button>
        {/if}
    {:else}
        <p>Ticket not found</p>
    {/if}
</div>