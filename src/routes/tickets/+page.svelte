

<script lang="ts">
    import { onMount } from "svelte";
    import type { Ticket } from "../../types/index.ts";
    import { resolve } from "$app/paths";

    const statuses = ['all', 'open', 'in_progress', 'closed'];
    let statusFilter = $state('all');
    let errors: string[] = $state([]);
    let tickets: Ticket[] = $state([]);
    let filteredTickets: Ticket[] = $derived(statusFilter === 'all'
                ? tickets
                : tickets.filter((ticket: Ticket) => ticket.status === statusFilter));

    onMount(async () => {
        const response = await fetch('/tickets');
        const result = await response.json();

        if (!response.ok) {
            errors = result.errors ?? [result.message ?? "Unable to fetch tickets"];
            return;
        }

        tickets = result.tickets ?? [];
        console.log(result.tickets)
    });

    ;
</script>
<style>
    .ticket {
        background: #f9fafb;
        border: 1px solid #d6d8db;
        border-radius: 8px;
        padding: 14px;
        margin-bottom: 12px;
    }

    .ticket p {
        margin: 0;
        color: #495057;
        line-height: 1.4;
    }

    .ticket .description {
        margin-left: 10px;
    }
</style>
<section>
    <a href={resolve("/", {})}>Return home</a>
    <div class="card">
        <h1>My Tickets</h1>

        <label>
            Show by status
            <select bind:value={statusFilter}>
                {#each statuses as status (status)}
                    <option value={status}>{status}</option>
                {/each}
            </select>
        </label>

        {#if errors.length}
            {#each errors as error (error)}
                <li>{error}</li>
            {/each}
        {/if}
        {#if filteredTickets.length > 0}
            <div class="ticket-list">
                {#each filteredTickets as ticket (ticket)}
                    <div class="ticket">
                        <b>{ticket.title}</b> &ndash; {ticket.status} &ndash; {ticket.category.replace('_',' ')}
                        {#if ticket.description}
                            <p class="description">{ticket.description}</p>
                        {/if}
                        <button onclick={() => window.location.href = `/tickets/${ticket.id}`}>Go to ticket</button>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</section>