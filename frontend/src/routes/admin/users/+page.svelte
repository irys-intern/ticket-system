<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '$lib/components/ui/dialog';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';

  let users: { id: string; name: string; email: string; role: string; status: string }[] = $state([]);
  let searchQuery = $state('');
  let selectedUser: typeof users[0] | null = $state(null);
  let errors: string[] = $state([]);
  let sortBy: keyof (typeof users)[0] = $state('id');
  let showEditModal = $state(false);

  let sortedUsers = $derived.by(() => {
    return [...users].sort((a, b) =>
      sortBy === 'id'
        ? parseInt(String(a.id)) - parseInt(String(b.id))
        : String(a[sortBy]).localeCompare(String(b[sortBy]))
    );
  });

  let filteredUsers = $derived(
    sortedUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  onMount(async () => {
    const response = await fetch(PUBLIC_BACKEND_URL+'/admin/users', { credentials: 'include' });
    const result = await response.json();
    if (!response.ok) {
      errors = result.errors ?? [result.message ?? 'Unable to fetch users'];
      return;
    }
    users = result.users;
  });

  function handleEdit(user: typeof users[0]) {
    selectedUser = { ...user };
    showEditModal = true;
  }

  function handleSave() {
    if (!selectedUser) return;
    fetch(PUBLIC_BACKEND_URL+'/admin/users', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manageUser: selectedUser.id, modification: selectedUser.role }),
    });
    users = users.map((u) => (u.id === selectedUser!.id ? { ...u, role: selectedUser!.role } : u));
    selectedUser = null;
    showEditModal = false;
  }

  const roleVariant = (role: string) =>
    role === 'admin' ? 'destructive' : role === 'agent' ? 'default' : 'secondary';
</script>

<div class="space-y-4">
  <div>
    <a href={resolve('/')} class="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">&larr; Return home</a>
  </div>

  <h1 class="text-2xl font-bold tracking-tight">User Management</h1>

  {#if errors.length}
    <Alert variant="destructive">
      <AlertDescription>
        {#each errors as error (error)}<p>{error}</p>{/each}
      </AlertDescription>
    </Alert>
  {/if}

  <div class="flex items-center gap-2">
    <Input type="text" placeholder="Search users…" bind:value={searchQuery} class="max-w-xs" />
    <div class="flex items-center gap-1.5">
      <Label for="sort-by" class="text-sm whitespace-nowrap">Sort by</Label>
      <select id="sort-by" bind:value={sortBy}
        class="h-8 min-w-28 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring">
        <option value="id">ID</option>
        <option value="name">Name</option>
        <option value="email">Email</option>
        <option value="role">Role</option>
      </select>
    </div>
  </div>

  <div class="rounded-lg border overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {#each filteredUsers as user (user.id)}
          <TableRow>
            <TableCell class="font-mono text-xs">{user.id}</TableCell>
            <TableCell>{user.name}</TableCell>
            <TableCell class="text-muted-foreground">{user.email}</TableCell>
            <TableCell><Badge variant={roleVariant(user.role)}>{user.role}</Badge></TableCell>
            <TableCell>
              <Button size="sm" variant="outline" onclick={() => handleEdit(user)}>Edit</Button>
            </TableCell>
          </TableRow>
        {/each}
        {#if filteredUsers.length === 0}
          <TableRow>
            <TableCell colspan={5} class="text-center text-muted-foreground py-6">No users found.</TableCell>
          </TableRow>
        {/if}
      </TableBody>
    </Table>
  </div>
</div>

<!-- Edit user dialog -->
<Dialog bind:open={showEditModal}>
  {#if selectedUser}
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit User Role</DialogTitle>
      </DialogHeader>
      <div class="space-y-3 py-2">
        <div class="space-y-1.5">
          <Label>Name</Label>
          <Input value={selectedUser.name} disabled />
        </div>
        <div class="space-y-1.5">
          <Label>Email</Label>
          <Input value={selectedUser.email} disabled />
        </div>
        <div class="space-y-1.5">
          <Label for="edit-role">Role</Label>
          <select id="edit-role" bind:value={selectedUser.role}
            class="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring">
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onclick={() => { selectedUser = null; showEditModal = false; }}>Cancel</Button>
        <Button onclick={handleSave}>Save</Button>
      </DialogFooter>
    </DialogContent>
  {/if}
</Dialog>
