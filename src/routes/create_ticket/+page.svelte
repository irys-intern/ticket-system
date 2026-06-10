<script lang="ts">
let title = $state('');
let description = $state('');
let category = $state('bug');
let priority = $state('low');
let successMessage = $state('');
let errors: string[] = $state([]);
import { onMount } from 'svelte';
import { resolve } from '$app/paths'
onMount(() => {
    document.title = 'Create Ticket';
});
async function handleSubmit(event: Event) {
    event.preventDefault();
    // Send the data to the server
    const response = await fetch('/create_ticket', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, description, category, priority })
    });
    const result = await response.json();
    if (response.ok) {
        successMessage = 'Ticket created successfully!';
        title = '';
        description = '';
        category = 'bug';
        priority = 'low';
        location.href = `/tickets/${result.ticketId}`
    } else {
        errors = result.errors ?? [ result.message ?? 'Failed to create ticket. Please try again.'];
    }
};
</script>
<a href={resolve("/", {})}>Return home</a>
<h1 class="text-2xl font-bold mb-4">Create Ticket</h1>
{#if successMessage }
    <div class="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-emerald-700">
        {successMessage}
    </div>
{/if}
{#if errors.length }
    <div class="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-4 text-rose-700">
        <ul>
            {#each errors as error (error)}
                <li>{error}</li>
            {/each}
        </ul>
    </div>
{/if}
<form class="space-y-4" onsubmit={handleSubmit} autocomplete="off">
    <div>
        <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
        <input type="text" id="title" name="title" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" bind:value={title} required>
    </div>
    <div>
        <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
        <textarea id="description" name="description" rows="4" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" bind:value={description} required></textarea>
    </div>
    <div>
        <label for="category" class="block text-sm font-medium text-gray-700">Category</label>
        <select id="category" name="category" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" bind:value={category} required>
            <option value="bug">Bug Report</option>
            <option value="feature_request">Feature Request</option>
            <option value="support">Support</option>
            <option value="other">Other</option>
        </select>
    </div>
    <div>
        <label for="priority" class="block text-sm font-medium text-gray-700">Priority</label>
        <select id="priority" name="priority" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" bind:value={priority} required>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
        </select>
    </div>
    <div>
        <button type="submit" class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Submit Ticket</button>
    </div>
</form>