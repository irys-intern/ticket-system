<script>
    import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	let userRole = $state('guest');
	let userName = $state('Guest User');
	let openTicketsUser = $state('loading...');
	let resolvedTicketsUser = $state('loading...');
	let assignedAgentTickets = $state('loading...');
	let adminTotal = $state('loading...');
	let adminOpen = $state('loading...');
	let adminUsers = $state('loading...');

	onMount(async () => {
		const response = await fetch('/');
		const data = await response.json();
		userRole = data.userRole || 'guest';
		userName = data.userName || 'Guest User';
		openTicketsUser = data.openTicketsUser || [];
		resolvedTicketsUser = data.resolvedTicketsUser || [];
		assignedAgentTickets = data.assignedAgentTickets || [];
		adminTotal = data.adminTotal || 0;
		adminOpen = data.adminOpen || 0;
		adminUsers = data.adminUsers || 0;
	});

</script>

<div class="dashboard">
	<h1>Ticket System Dashboard</h1>
    <h2>Welcome, {userName}!
        {#if userRole !== "guest"}
        <a href={resolve('/auth/logout', {})}>Logout</a>
        {/if}
    </h2>
    <p>Your role: <b>{userRole}</b></p>
    <p class="text-sm text-gray-600 mb-6">This dashboard content is dynamically rendered based on your user role.</p>
	{#if userRole === 'admin'}
		<div class="admin-dashboard">
			<h2>Admin Dashboard</h2>
			<div class="card">
				<h3>System Statistics</h3>
				<p>Total Tickets: {adminTotal}</p>
				<p>Open Tickets (unassigned): {adminOpen}</p>
				<p>Users: {adminUsers}</p>
			</div>
			<div class="card">
				<h3>Admin Tools</h3>
				<button>Manage Users</button>
				<button>View Reports</button>
				<button>System Settings</button>
			</div>
		</div>
	{:else if userRole === 'agent'}
        <div class="agent-dashboard">
            <h2>Agent Dashboard</h2>
            <div class="card">
                <h3>Assigned Tickets</h3>
                <p>You have {assignedAgentTickets.length} tickets assigned to you.</p>
                <button>View My Tickets</button>
            </div>
            <div class="card">
                <h3>Agent Tools</h3>
                <button>Update Ticket Status</button>
                <button>View Knowledge Base</button>
            </div>
        </div>
	{:else if userRole === 'user'}
		<div class="user-dashboard">
			<h2>My Tickets</h2>
			<div class="card">
				<h3>Your Statistics</h3>
				<p>Open Tickets: {openTicketsUser.length}</p>
				<p>Resolved Tickets: {resolvedTicketsUser.length}</p>
			</div>
			<div class="card">
				<h3>Actions</h3>
				<button onclick={() => window.location.href = '/create_ticket'}>Create New Ticket</button>
				<button>View My Tickets</button>
			</div>
		</div>
	{:else}
		<div class="guest-dashboard">
			<div class="card">
				<p>You have limited access. Please log in to create and manage tickets.</p>
				<button onclick={() => window.location.href = '/auth/login'}>Login</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.dashboard {
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
		font-family: Arial, sans-serif;
	}

    a {
        color: #007bff;
        text-decoration: none;
        margin-left: 15px;
    }

	h1 {
		color: #111;
		margin-bottom: 30px;
        font-size: 32px;
	}
	h2 {
		color: #333;
		margin-bottom: 20px;
        font-size: 24px;
	}

	.card {
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 15px;
		margin-bottom: 15px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.card h3 {
		margin-top: 0;
		color: #555;
	}

	.card p {
		margin: 8px 0;
		color: #666;
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

	button:hover {
		background: #0056b3;
	}
</style>
