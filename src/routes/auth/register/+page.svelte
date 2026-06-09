<script lang="ts">
  import { resolve } from "$app/paths";

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
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        errors = result.errors ?? [result.message ?? 'Unable to register'];
      } else {
        successMessage = result.message ?? 'Registration completed successfully. Please <a href="/auth/login" class="underline">log in</a>.';
        name = '';
        email = '';
        password = '';
        location.href = '/auth/login'; // Redirect to login page after successful registration
      }
    } catch (error) {
      errors = ['Unable to reach the registration service. Please try again later.'];
      console.error(error);
    } finally {
      submitting = false;
    }
  }
</script>

<section class="register-page px-4 py-8 max-w-lg mx-auto">
  <h1 class="text-3xl font-bold mb-4">Create an account</h1>
  <p class="mb-6 text-slate-600">Sign up to submit tickets and manage requests.</p>
    <p class="mb-6 text-slate-600">Alternatively, <a href={resolve("/auth/login", {})}>log in</a>.</p>


  {#if successMessage}
    <div class="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-emerald-700">
      {successMessage}
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
      <label for="name" class="block text-sm font-medium mb-1">Name</label>
      <input
        id="name"
        type="text"
        bind:value={name}
        required
        class="w-full rounded border px-3 py-2"
        placeholder="Your name"
      />
    </div>

    <div>
      <label for="email" class="block text-sm font-medium mb-1">Email</label>
      <input
        id="email"
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
      {submitting ? 'Registering...' : 'Register'}
    </button>
  </form>
</section>
