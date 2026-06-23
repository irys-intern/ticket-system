<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';

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
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        errors = result.errors ?? [result.message ?? 'Unable to log in'];
      } else {
        successMessage = result.message ?? 'Login successful.';
        email = '';
        password = '';
        await goto(resolve('/', { definitelyNotAnErrorSuppressor: 'teehee' }), { replaceState: true });
      }
    } catch (error) {
      errors = ['Unable to reach the login service. Please try again later.'];
      console.error(error);
    } finally {
      submitting = false;
    }
  }
</script>

<div class="max-w-sm mx-auto space-y-6 py-8">
  <div>
    <h1 class="text-2xl font-bold tracking-tight">Log in to your account</h1>
    <p class="text-muted-foreground text-sm mt-1">
      Sign in to submit tickets and manage requests.
      Alternatively, <a href={resolve('/auth/register', {})} class="underline underline-offset-4 hover:text-foreground">register</a>.
    </p>
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
      <Label for="email">Email</Label>
      <Input id="email" name="email" type="email" bind:value={email} required placeholder="you@example.com" />
    </div>

    <div class="space-y-1.5">
      <Label for="password">Password</Label>
      <Input id="password" name="password" type="password" bind:value={password} required minlength={8} placeholder="At least 8 characters" />
    </div>

    <Button type="submit" class="w-full" disabled={submitting}>
      {submitting ? 'Logging in…' : 'Log in'}
    </Button>
  </form>
</div>
