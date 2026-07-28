<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page as pageStore } from '$app/state';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import BackLink from '$lib/components/BackLink.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '$lib/components/ui/table';
  import { toast } from '$lib/toast';
  import FloppyDiskIcon from 'phosphor-svelte/lib/FloppyDiskIcon';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
  import PencilSimpleIcon from 'phosphor-svelte/lib/PencilSimpleIcon';
  import ProhibitIcon from 'phosphor-svelte/lib/ProhibitIcon';
  import TrashIcon from 'phosphor-svelte/lib/TrashIcon';
  import UserCheckIcon from 'phosphor-svelte/lib/UserCheckIcon';
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
  import { untrack } from 'svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let users: { id: string; name: string; email: string; role: string; active: boolean }[] = $state(
    untrack(() => data.users)
  );
  let searchQuery = $state(untrack(() => data.q));
  let selectedUser: (typeof users)[0] | null = $state(null);
  let errors: string[] = $state(untrack(() => data.errors));
  let sortBy: keyof (typeof users)[0] = $state('id');
  let showEditModal = $state(false);
  let currentUserId: string | null = untrack(() => data.currentUserId);
  let showDeleteModal = $state(false);
  let userToDelete: (typeof users)[0] | null = $state(null);

  // The server already applied search + pagination; sort here just reorders
  // the current page, since re-sorting across pages would require server-side
  // ORDER BY for every column.
  $effect(() => {
    users = data.users;
    errors = data.errors;
  });

  let sortedUsers = $derived.by(() => {
    return [...users].sort((a, b) =>
      sortBy === 'id'
        ? parseInt(String(a.id)) - parseInt(String(b.id))
        : String(a[sortBy]).localeCompare(String(b[sortBy]))
    );
  });

  function navigate(params: { page?: number; q?: string }) {
    const next = new URLSearchParams(pageStore.url.searchParams);
    if (params.q !== undefined) {
      if (params.q) next.set('q', params.q);
      else next.delete('q');
      next.delete('page');
    }
    if (params.page !== undefined) {
      if (params.page > 1) next.set('page', String(params.page));
      else next.delete('page');
    }
    goto(`?${next}`, { keepFocus: true, noScroll: true });
  }

  let searchDebounce: ReturnType<typeof setTimeout>;
  function onSearchInput() {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => navigate({ q: searchQuery }), 300);
  }

  function handleEdit(user: (typeof users)[0]) {
    selectedUser = { ...user };
    showEditModal = true;
  }

  function handleDelete(user: (typeof users)[0]) {
    userToDelete = user;
    showDeleteModal = true;
  }

  async function confirmDelete() {
    if (!userToDelete) return;
    const user = userToDelete;
    showDeleteModal = false;
    userToDelete = null;
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

  async function handleToggleActive(user: (typeof users)[0]) {
    const nextActive = !user.active;
    const response = await fetch(PUBLIC_BACKEND_URL + `/admin/users/${user.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: nextActive }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(result.message ?? 'Unable to update user');
      return;
    }
    users = users.map((u) => (u.id === user.id ? { ...u, active: nextActive } : u));
    toast.success(`${nextActive ? 'Activated' : 'Deactivated'} "${user.name}".`);
  }

  function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  async function handleSave() {
    if (!selectedUser) return;
    const response = await fetch(PUBLIC_BACKEND_URL + '/admin/users', {
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

<title>User Management</title>

<div class="space-y-4">
  <div>
    <BackLink href={resolve('/')} />
  </div>

  <div>
    <div class="flex items-center gap-2.5">
      <h1 class="text-2xl font-bold tracking-tight">User Management</h1>
      <Badge variant="secondary">{data.total} users</Badge>
    </div>
    <p class="text-sm text-muted-foreground">View and manage user accounts and roles.</p>
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
      <MagnifyingGlassIcon
        class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="text"
        placeholder="Search users…"
        bind:value={searchQuery}
        oninput={onSearchInput}
        class="max-w-xs pl-8"
      />
    </div>
    <div class="flex items-center gap-1.5">
      <Label for="sort-by" class="text-sm whitespace-nowrap">Sort by</Label>
      <select
        id="sort-by"
        bind:value={sortBy}
        class="h-8 min-w-28 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <option value="id">ID</option>
        <option value="name">Name</option>
        <option value="email">Email</option>
        <option value="role">Role</option>
      </select>
    </div>
  </div>

  <div class="overflow-hidden rounded-lg border border-input">
    <Table class="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead class="w-16">ID</TableHead>
          <TableHead class="w-36">Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead class="w-20">Role</TableHead>
          <TableHead class="w-20">Status</TableHead>
          <TableHead class="w-72">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {#each sortedUsers as user (user.id)}
          <TableRow>
            <TableCell class="truncate font-mono text-xs text-muted-foreground" title={user.id}
              >{user.id}</TableCell
            >
            <TableCell>
              <div class="flex min-w-0 items-center gap-2.5">
                <span
                  class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                >
                  {initials(user.name)}
                </span>
                <span class="min-w-0 truncate font-medium" title={user.name}>{user.name}</span>
              </div>
            </TableCell>
            <TableCell class="truncate text-muted-foreground" title={user.email}>{user.email}</TableCell>
            <TableCell><Badge variant={roleVariant(user.role)}>{user.role}</Badge></TableCell>
            <TableCell>
              <Badge variant={user.active ? 'secondary' : 'outline'}>
                {user.active ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell class="flex flex-wrap items-center gap-1.5 whitespace-normal">
              {#if user.id === currentUserId}
                <span class="inline-flex h-7 items-center text-xs text-muted-foreground">(you)</span>
              {:else}
                <Button size="sm" variant="outline" onclick={() => handleEdit(user)}
                  ><PencilSimpleIcon /> Edit</Button
                >
                <Button size="sm" variant="outline" onclick={() => handleToggleActive(user)}>
                  {#if user.active}
                    <ProhibitIcon /> Deactivate
                  {:else}
                    <UserCheckIcon /> Activate
                  {/if}
                </Button>
                <Button size="sm" variant="destructive" onclick={() => handleDelete(user)}
                  ><TrashIcon /> Delete</Button
                >
              {/if}
            </TableCell>
          </TableRow>
        {/each}
        {#if sortedUsers.length === 0}
          <TableRow>
            <TableCell colspan={6} class="py-6 text-center text-muted-foreground"
              >No users found.</TableCell
            >
          </TableRow>
        {/if}
      </TableBody>
    </Table>
  </div>

  <Pagination
    page={data.page}
    totalPages={data.totalPages}
    total={data.total}
    onPageChange={(p) => navigate({ page: p })}
  />
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
          <select
            id="edit-role"
            bind:value={selectedUser.role}
            class="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onclick={() => {
            selectedUser = null;
            showEditModal = false;
          }}>Cancel</Button
        >
        <Button onclick={handleSave}><FloppyDiskIcon /> Save</Button>
      </DialogFooter>
    </DialogContent>
  {/if}
</Dialog>

<!-- Delete user confirmation dialog -->
<Dialog bind:open={showDeleteModal}>
  {#if userToDelete}
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete user</DialogTitle>
        <DialogDescription>
          Delete user "{userToDelete.name}"? This cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button
          variant="outline"
          onclick={() => {
            userToDelete = null;
            showDeleteModal = false;
          }}>Cancel</Button
        >
        <Button variant="destructive" onclick={confirmDelete}><TrashIcon /> Delete</Button>
      </DialogFooter>
    </DialogContent>
  {/if}
</Dialog>
