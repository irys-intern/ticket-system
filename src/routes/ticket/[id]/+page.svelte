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
            const response = await fetch(`/ticket/${id}`);
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
<style>
    a {
        color: #007bff;
        text-decoration: none;
    }
	h1 {
		color: #111;
		margin-bottom: 30px;
        font-size: 32px;
	}

	.card {
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 15px;
		margin-bottom: 15px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

    button {
		background: #007bff;
		color: white;
		padding: 10px 15px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		margin-right: 10px;
		margin-bottom: 10px;
		font-size: 14px;
	}

    button.danger {
        background: #ff1a1a;
    }
    button.danger:hover {
        background: #af1212;
    }

	button:hover {
		background: #0056b3;
	}
</style>
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