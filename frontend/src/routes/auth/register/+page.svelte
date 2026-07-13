<title>Register</title>
<script lang="ts">
  import { resolve } from '$app/paths';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';
  import { toast, queueToast } from '$lib/toast';
  import UserIcon from 'phosphor-svelte/lib/UserIcon';
  import EnvelopeSimpleIcon from 'phosphor-svelte/lib/EnvelopeSimpleIcon';
  import LockKeyIcon from 'phosphor-svelte/lib/LockKeyIcon';
  import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircleIcon';
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
  import CircleNotchIcon from 'phosphor-svelte/lib/CircleNotchIcon';
  import TicketIcon from 'phosphor-svelte/lib/TicketIcon';

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let submitting = $state(false);
  let successMessage = $state('');
  let errors: string[] = $state([]);

  async function handleSubmit(event: Event) {
    event.preventDefault();
    successMessage = '';
    errors = [];

    if (password !== confirmPassword) {
      errors = ['Passwords do not match'];
      return;
    }

    submitting = true;

    try {
      const response = await fetch(`${PUBLIC_BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        errors = result.errors ?? [result.message ?? 'Unable to register'];
        toast.error(errors[0]);
      } else {
        successMessage = result.message ?? 'Registration successful. Redirecting to login…';
        name = '';
        email = '';
        password = '';
        confirmPassword = '';
        queueToast('success', successMessage);
        location.href = '/auth/login';
      }
    } catch (error) {
      errors = ['Unable to reach the registration service. Please try again later.'];
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
      <CardTitle class="text-xl">Create an account</CardTitle>
      <p class="text-sm text-muted-foreground">
        Already have one? <a href={resolve('/auth/login')} class="font-medium text-primary underline-offset-4 hover:underline">Log in</a>
      </p>
    </CardHeader>

    <CardContent>
      {#if successMessage}
        <Alert variant="success" class="mb-4">
          <CheckCircleIcon />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      {/if}

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
          <Label for="name">Name</Label>
          <div class="relative">
            <UserIcon class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="name" type="text" bind:value={name} required placeholder="Your name" class="pl-8" />
          </div>
        </div>

        <div class="space-y-1.5">
          <Label for="email">Email</Label>
          <div class="relative">
            <EnvelopeSimpleIcon class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" bind:value={email} required placeholder="you@example.com" class="pl-8" />
          </div>
        </div>

        <div class="space-y-1.5">
          <Label for="password">Password</Label>
          <div class="relative">
            <LockKeyIcon class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type="password" bind:value={password} required minlength={8} placeholder="At least 8 characters" class="pl-8" />
          </div>
        </div>

        <div class="space-y-1.5">
          <Label for="confirm-password">Confirm Password</Label>
          <div class="relative">
            <LockKeyIcon class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="confirm-password" type="password" bind:value={confirmPassword} required minlength={8} placeholder="Re-enter your password" class="pl-8" />
          </div>
        </div>

        <Button type="submit" class="w-full" disabled={submitting}>
          {#if submitting}
            <CircleNotchIcon class="size-4 animate-spin" />
          {/if}
          {submitting ? 'Registering…' : 'Register'}
        </Button>
      </form>
    </CardContent>
  </Card>
</div>
