<script lang="ts">
    import { onMount } from "svelte";
    import { resolve } from "$app/paths";


	let users: {id: string; name: string; email: string; role: string; status: string}[] = $state([]);
	let searchQuery = $state('');
	let selectedUser: typeof users[0] | null = $state(null);
    let errors: string[] = $state([]);
    let sortBy: keyof typeof users[0] = $state('id');
    let sortedUsers = $derived.by(() => {
  return [...users].sort((a, b) => {
    return sortBy === 'id'
      ? parseInt(String(a.id)) - parseInt(String(b.id))
      : String(a[sortBy]).localeCompare(String(b[sortBy]));
  });
});
    onMount(async () => {
        const response = await fetch('/admin/users');
        const result = await response.json()
        if (!response.ok) {
            errors = result.errors ?? [result.message ?? "Unable to fetch users"]
            return;
        }
        users = result.users
    })

	function handleEdit(user: typeof users[0]) {
		selectedUser = user;
	}

	function handleSave() {
        if (!selectedUser) return
        fetch('/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({manageUser: selectedUser.id, modification: selectedUser.role})
        })
		selectedUser = null;
	}
</script>

<div class="container">
    <a href={resolve("/", {})}>Return home</a>
	<h1>User Management</h1>
    {#if errors.length}
        {#each errors as error (error)}
            <p style="color:red">{error}</p>
        {/each}
    {/if}
	<div class="search-bar">
		<input type="text" placeholder="Search users..." bind:value={searchQuery} />
        <select bind:value={sortBy} placeholder="id">
            <option value="id">ID</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
            <option value="role">Role</option>
        </select>
	</div>

	<div class="user-list">
		<table>
			<thead>
				<tr>
					<th>User ID</th>
					<th>Name</th>
					<th>Email</th>
					<th>Role</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each sortedUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())) as user (user.id)}
					<tr>
						<td>{user.id}</td>
						<td>{user.name}</td>
						<td>{user.email}</td>
						<td>{user.role}</td>
						<td>
							<button onclick={() => handleEdit(user)}>Edit</button>
							<!-- <button onclick={() => handleDelete(user.id)}>Delete</button> -->
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if selectedUser}
		<div class="modal">
			<div class="modal-content">
				<h2>Edit User Role</h2>
				<input type="text" bind:value={selectedUser.name} placeholder="Name" readonly disabled/>
				<input type="email" bind:value={selectedUser.email} placeholder="Email" readonly disabled/>
				<select bind:value={selectedUser.role}>
					<option value="admin">Admin</option>
					<option value="agent">Agent</option>
					<option value="user">User</option>
				</select>
				<button onclick={handleSave}>Save</button>
				<button onclick={() => (selectedUser = null)}>Cancel</button>
			</div>
		</div>
        {/if}
    </div>
    
    <style>
	.container {
        padding: 20px;
	}
    
	h1 {
        margin-bottom: 20px;
	}
    
	.search-bar {
        margin-bottom: 20px;
	}
    .search-bar select {
        width: 150px;
    }
    
	input[type='text'],
	input[type='email'],
	select {
		padding: 8px;
		margin-right: 10px;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		border: 1px solid #ddd;
		padding: 12px;
		text-align: left;
	}

	th {
		background-color: #f4f4f4;
		font-weight: bold;
	}

	tr:hover {
		background-color: #f9f9f9;
	}

	button {
		padding: 8px 12px;
		margin-right: 5px;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	button:hover {
		background-color: #0056b3;
	}

	.modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal-content {
		background-color: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		max-width: 500px;
	}

	.modal-content h2 {
		margin-bottom: 15px;
	}

	.modal-content input,
	.modal-content select {
		display: block;
		width: 100%;
		margin-bottom: 10px;
	}
</style>
