<title>Login</title>
<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { toast } from '$lib/toast';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import EnvelopeSimpleIcon from 'phosphor-svelte/lib/EnvelopeSimpleIcon';
  import LockKeyIcon from 'phosphor-svelte/lib/LockKeyIcon';
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
  import CircleNotchIcon from 'phosphor-svelte/lib/CircleNotchIcon';
  import TicketIcon from 'phosphor-svelte/lib/TicketIcon';

  let email = $state('');
  let password = $state('');
  let submitting = $state(false);
  let errors: string[] = $state([]);

  async function handleSubmit(event: Event) {
    event.preventDefault();
    submitting = true;
    errors = [];

    try {
      const response = await fetch(`${PUBLIC_BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        errors = result.errors ?? [result.message ?? 'Unable to log in'];
        toast.error(errors[0]);
      } else {
        email = '';
        password = '';
        await goto(resolve('/'), { replaceState: true, invalidateAll: true });
      }
    } catch (error) {
      errors = ['Unable to reach the login service. Please try again later.'];
      toast.error(errors[0]);
      console.error(error);
    } finally {
      submitting = false;
    }
  }
</script>

<div class="mx-auto flex min-h-[70vh] w-full max-w-sm items-center">
  <Card class="w-full">
    <CardHeader>
      <div class="mb-2 flex items-center gap-2">
        <TicketIcon class="size-5 text-primary" weight="fill" />
        <span class="text-sm font-semibold">Ticket System</span>
      </div>
      <CardTitle class="text-xl">Log in to your account</CardTitle>
      <p class="text-sm text-muted-foreground">
        Don't have one? <a href={resolve('/auth/register')} class="font-medium text-primary underline-offset-4 hover:underline">Register</a>
      </p>
    </CardHeader>

    <CardContent>
      {#if errors.length}
        <Alert variant="destructive" class="mb-4">
          <WarningCircleIcon />
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
          <div class="relative">
            <EnvelopeSimpleIcon class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" name="email" type="email" bind:value={email} required placeholder="you@example.com" class="pl-8" />
          </div>
        </div>

        <div class="space-y-1.5">
          <Label for="password">Password</Label>
          <div class="relative">
            <LockKeyIcon class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" name="password" type="password" bind:value={password} required minlength={8} placeholder="At least 8 characters" class="pl-8" />
          </div>
        </div>

        <Button type="submit" class="w-full" disabled={submitting}>
          {#if submitting}
            <CircleNotchIcon class="size-4 animate-spin" />
          {/if}
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </CardContent>
  </Card>
</div>
