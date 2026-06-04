<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        errors = result.errors ?? [result.message ?? 'Unable to log in'];
      } else {
        successMessage = result.message ?? 'Login completed successfully. Please <a href="/" class="underline">return home</a>.';
        email = '';
        password = '';
        await goto(resolve("/", { definitelyNotAnErrorSuppressor: "teehee"}), { replaceState: true });
      }
    } catch (error) {
      errors = ['Unable to reach the login service. Please try again later.'];
      console.error(error);
    } finally {
      submitting = false;
    }
  }
</script>

<section class="login-page px-4 py-8 max-w-lg mx-auto">
  <h1 class="text-3xl font-bold mb-4">Log in to your account</h1>
  <p class="mb-6 text-slate-600">Sign in to submit tickets and manage requests.</p>

  {#if successMessage}
    <div class="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-emerald-700">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html successMessage}
    </div>
  {/if}

  {#if errors.length}
    <div class="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-4 text-rose-700">
      <ul>
        {#each errors as error (error)}
          <li>{error}</li>
        {/each}
      </ul>
    </div>
  {/if}

  <form onsubmit={handleSubmit} class="space-y-4">
    <div>
      <label for="email" class="block text-sm font-medium mb-1">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        bind:value={email}
        required
        class="w-full rounded border px-3 py-2"
        placeholder="you@example.com"
      />
    </div>

    <div>
      <label for="password" class="block text-sm font-medium mb-1">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        bind:value={password}
        required
        minlength="8"
        class="w-full rounded border px-3 py-2"
        placeholder="At least 8 characters"
      />
    </div>

    <button
      type="submit"
      class="w-full rounded bg-slate-900 text-white py-2 disabled:opacity-60"
      disabled={submitting}
    >
      {submitting ? 'Logging in...' : 'Log in'}
    </button>
  </form>
</section>
