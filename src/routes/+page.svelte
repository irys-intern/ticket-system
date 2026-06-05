<script>
	import { onMount } from 'svelte';
	let userRole = $state('guest');
	let userName = $state('Guest User');

	onMount(async () => {
		const response = await fetch('/');
		const data = await response.json();
		userRole = data.userRole || 'guest';
		userName = data.userName || 'Guest User';
	});
</script>

<div class="dashboard">
	<h1>Ticket System Dashboard</h1>
    <h2>Welcome, {userName}!</h2>
    <p>Your role: <b>{userRole}</b></p>
    <p class="text-sm text-gray-600 mb-6">This dashboard content is dynamically rendered based on your user role.</p>
	{#if userRole === 'admin'}
		<div class="admin-dashboard">
			<h2>Admin Dashboard</h2>
			<div class="card">
				<h3>System Statistics</h3>
				<p>Total Tickets: 1,245</p>
				<p>Open Tickets: 342</p>
				<p>Users: 89</p>
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
                <p>You have 15 tickets assigned to you.</p>
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
				<p>Open Tickets: 3</p>
				<p>Resolved Tickets: 12</p>
			</div>
			<div class="card">
				<h3>Actions</h3>
				<button>Create New Ticket</button>
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

	.role-selector {
		margin-bottom: 30px;
		padding: 15px;
		background: #f5f5f5;
		border-radius: 8px;
	}

	.role-selector label {
		font-weight: bold;
	}

	.role-selector select {
		margin-left: 10px;
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 14px;
	}

	h2 {
		color: #333;
		margin-bottom: 20px;
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
