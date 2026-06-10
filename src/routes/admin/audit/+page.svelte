<script lang="ts">
  import { resolve } from "$app/paths";
  import { onMount } from "svelte";
  import type { AuditEvent, Ticket, User } from "../../../types/index.ts";

	let query = $state('');
	let pageState = $state(1);
	const perPage = 10;
    let filtered;
    let total = $state(0);
    let pages = $state(0);
    let page = $state(0);
    let pageItems: AuditEvent[] = $state([]);
    let users: User[] = $state([]);
    onMount(async () => {
        const res = await fetch(window.location.href);
        const resp = await res.json()
        filtered = resp.events.filter((e: { user: User; action: AuditEvent; target: Ticket; }) => {
            const s = `${e.user} ${e.action} ${e.target}`.toLowerCase();
            return s.includes(query.trim().toLowerCase());
        });
        users = resp.users;
        total = filtered.length;
        pages = Math.max(1, Math.ceil(total / perPage));
        page = Math.min(Math.max(1, pageState), pages);
        pageItems = filtered.slice((page - 1) * perPage, page * perPage);
    })
    function getUserString(userId: string) {
        const user = users.find((u) => u.id === userId);
        return user ? `${user.name} (${user.id})` : `User ${userId}`;
    }
    function prev() { if (page > 1) pageState -= 1; }
    function next() { if (page < pages) pageState += 1; }


</script>
<style>
    .mt-4.flex.items-center.justify-between.text-sm.text-gray-600 button {
        margin-left: 5px;
        line-height: .25;
    }
</style>
<div class="p-6 bg-gray-50 min-h-screen">
	<div class="max-w-6xl mx-auto">
		<div class="items-center justify-between mb-6">
            <a href={resolve("/", {})}>Return home</a>
			<h1 class="text-2xl font-semibold text-gray-800">Audit Log</h1>
			<div>
				<input
					type="search"
					bind:value={query}
					placeholder="Search user, action, ticket, ip..."
					class="px-3 py-2 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
				/>
			</div>
		</div>

		<div class="bg-white shadow-sm rounded-lg overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">When</th>
						<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
						<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
						<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket ID</th>
					    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ID</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-100">
					{#if !pageItems || pageItems.length === 0}
						<tr>
							<td class="px-4 py-6 text-sm text-gray-500" colspan="6">No audit entries found.</td>
						</tr>
					{:else}
						{#each pageItems as e (e)}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3 text-sm text-gray-600">{new Date(e.createdAt).toLocaleString()}</td>
								<td class="px-4 py-3 text-sm font-medium text-gray-800">{getUserString(e.userId)}</td>
								<td class="px-4 py-3 text-sm text-gray-700">{e.action}</td>
								<td class="px-4 py-3 text-sm text-indigo-600"><a href={resolve(`/tickets/${e.ticketId}`, {})}>#{e.ticketId}</a></td>
								<td class="px-4 py-3 text-sm text-right text-gray-400">#{e.id}</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
		<div class="mt-4 flex items-center justify-between text-sm text-gray-600">
			<div>Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}</div>
			<div class="flex items-center space-x-2">
				<button onclick={prev} disabled={page===1}>Prev</button>
				<div>Page {page} / {pages}</div>
				<button onclick={next} disabled={page===pages}>Next</button>
			</div>
		</div>
	</div>
</div>
