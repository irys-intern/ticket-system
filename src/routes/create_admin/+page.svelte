<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let submitting = $state(false);
  let successMessage = $state('');
  let errors: string[] = $state([]);

  async function handleSubmit(event: Event) {
    event.preventDefault();
    submitting = true;
    successMessage = '';
    errors = [];

    try {
      const response = await fetch('/create_admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        errors = result.errors ?? [result.message ?? 'Unable to create admin'];
      } else {
        successMessage = result.message ?? 'Admin account created. Redirecting to login…';
        name = '';
        email = '';
        password = '';
        location.href = '/auth/login';
      }
    } catch (error) {
      errors = ['Unable to reach the service. Please try again later.'];
      console.error(error);
    } finally {
      submitting = false;
    }
  }
</script>

<div class="max-w-sm mx-auto space-y-6 py-8">
  <div>
    <h1 class="text-2xl font-bold tracking-tight">Create an admin account</h1>
    <p class="text-muted-foreground text-sm mt-1">Sign up to manage users and agents.</p>
  </div>

  {#if successMessage}
    <Alert class="border-green-200 bg-green-50 text-green-800">
      <AlertDescription>{successMessage}</AlertDescription>
    </Alert>
  {/if}

  {#if errors.length}
    <Alert variant="destructive">
      <AlertDescription>
        <ul class="list-disc list-inside space-y-1">
          {#each errors as error (error)}
            <li>{error}</li>
          {/each}
        </ul>
      </AlertDescription>
    </Alert>
  {/if}

  <form onsubmit={handleSubmit} class="space-y-4">
    <div class="space-y-1.5">
      <Label for="name">Name</Label>
      <Input id="name" type="text" bind:value={name} required placeholder="Your name" />
    </div>

    <div class="space-y-1.5">
      <Label for="email">Email</Label>
      <Input id="email" type="email" bind:value={email} required placeholder="you@example.com" />
    </div>

    <div class="space-y-1.5">
      <Label for="password">Password</Label>
      <Input id="password" type="password" bind:value={password} required minlength={8} placeholder="At least 8 characters" />
    </div>

    <Button type="submit" class="w-full" disabled={submitting}>
      {submitting ? 'Creating…' : 'Create Admin'}
    </Button>
  </form>
</div>
