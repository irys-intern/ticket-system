<title>User Management</title>
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
  import BackLink from '$lib/components/BackLink.svelte';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import { toast } from '$lib/toast';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
  import PencilSimpleIcon from 'phosphor-svelte/lib/PencilSimpleIcon';
  import TrashIcon from 'phosphor-svelte/lib/TrashIcon';
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
  import FloppyDiskIcon from 'phosphor-svelte/lib/FloppyDiskIcon';

  let users: { id: string; name: string; email: string; role: string; status: string }[] = $state([]);
  let searchQuery = $state('');
  let selectedUser: typeof users[0] | null = $state(null);
  let errors: string[] = $state([]);
  let sortBy: keyof (typeof users)[0] = $state('id');
  let showEditModal = $state(false);
  let currentUserId: string | null = $state(null);

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
    const meRes = await fetch(PUBLIC_BACKEND_URL + '/auth/me', { credentials: 'include' });
    if (meRes.ok) {
      const meData = await meRes.json();
      currentUserId = meData.session?.userId ?? null;
    }

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

  async function handleDelete(user: typeof users[0]) {
    if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    const response = await fetch(PUBLIC_BACKEND_URL + `/admin/users/${user.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const result = await response.json();
    if (!response.ok) {
      const message = result.message ?? 'Unable to delete user';
      errors = [message];
      toast.error(message);
      return;
    }
    users = users.filter((u) => u.id !== user.id);
    toast.success(`Deleted "${user.name}".`);
  }

  function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  async function handleSave() {
    if (!selectedUser) return;
    const response = await fetch(PUBLIC_BACKEND_URL+'/admin/users', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manageUser: selectedUser.id, modification: selectedUser.role }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      toast.error(result.message ?? 'Unable to update user');
      return;
    }
    users = users.map((u) => (u.id === selectedUser!.id ? { ...u, role: selectedUser!.role } : u));
    toast.success(`Updated "${selectedUser.name}".`);
    selectedUser = null;
    showEditModal = false;
  }

  const roleVariant = (role: string) =>
    role === 'admin' ? 'destructive' : role === 'agent' ? 'default' : 'secondary';
</script>

<div class="space-y-4">
  <div>
    <BackLink href={resolve('/')} />
  </div>

  <div class="flex items-center gap-2.5">
    <h1 class="text-2xl font-bold tracking-tight">User Management</h1>
    <Badge variant="secondary">{users.length} users</Badge>
  </div>

  {#if errors.length}
    <Alert variant="destructive">
      <WarningCircleIcon />
      <AlertDescription>
        {#each errors as error (error)}<p>{error}</p>{/each}
      </AlertDescription>
    </Alert>
  {/if}

  <div class="flex items-center gap-2">
    <div class="relative">
      <MagnifyingGlassIcon class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input type="text" placeholder="Search users…" bind:value={searchQuery} class="max-w-xs pl-8" />
    </div>
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
            <TableCell class="font-mono text-xs text-muted-foreground">{user.id}</TableCell>
            <TableCell>
              <div class="flex items-center gap-2.5">
                <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initials(user.name)}
                </span>
                <span class="font-medium">{user.name}</span>
              </div>
            </TableCell>
            <TableCell class="text-muted-foreground">{user.email}</TableCell>
            <TableCell><Badge variant={roleVariant(user.role)}>{user.role}</Badge></TableCell>
            <TableCell class="space-x-1.5">
              {#if user.id === currentUserId}
                <span class="text-xs text-muted-foreground">(you)</span>
              {:else}
                <Button size="sm" variant="outline" onclick={() => handleEdit(user)}><PencilSimpleIcon /> Edit</Button>
                <Button size="sm" variant="destructive" onclick={() => handleDelete(user)}><TrashIcon /> Delete</Button>
              {/if}
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
        <Button onclick={handleSave}><FloppyDiskIcon /> Save</Button>
      </DialogFooter>
    </DialogContent>
  {/if}
</Dialog>
