<title>Logout</title>
<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { toast } from '$lib/toast';
  import { Button } from '$lib/components/ui/button';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';

  let errors: string[] = $state([]);
  let successMessage = $state('');

  async function handleSubmit(event: Event) {
    event.preventDefault();
    try {
      const response = await fetch(`${PUBLIC_BACKEND_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        errors = result.errors ?? [result.message ?? 'Unable to log out'];
        toast.error(errors[0]);
      } else {
        successMessage = result.message ?? 'You have been logged out successfully.';
        toast.success(successMessage);
        await goto(resolve('/'), { replaceState: true });
      }
    } catch (error) {
      errors = ['Unable to reach the logout service. Please try again later.'];
      toast.error(errors[0]);
      console.error(error);
    }
  }

  function backToHome() {
    goto(resolve('/'), { replaceState: true });
  }
</script>

<div class="max-w-sm mx-auto space-y-6 py-8">
  <div>
    <h1 class="text-2xl font-bold tracking-tight">Log out</h1>
    <p class="text-muted-foreground text-sm mt-1">Are you sure you want to log out?</p>
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

  <form onsubmit={handleSubmit} class="flex gap-2">
    <Button type="submit" variant="destructive">Log Out</Button>
    <Button type="button" variant="outline" onclick={backToHome}>Cancel</Button>
  </form>
</div>
