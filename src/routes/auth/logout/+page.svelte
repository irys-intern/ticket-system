<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  let errors: string[] = $state([]);
  let successMessage = $state('');

  async function handleSubmit(event: Event) {
    event.preventDefault();
    try {
      const response = await fetch('/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        errors = result.errors ?? [result.message ?? 'Unable to log out'];
      } else {
        successMessage = result.message ?? 'You have been logged out successfully. Please <a href="/" class="underline">return home</a>.';
        await goto(resolve("/", { definitelyNotAnErrorSuppressor: "teehee"}), { replaceState: true });
      }
    } catch (error) {
      errors = ['Unable to reach the logout service. Please try again later.'];
      console.error(error);
    }
  }

  function backToHome() {
    goto(resolve("/", { definitelyNotAnErrorSuppressor: "teehee"}), { replaceState: true });
  }
</script>
<section class="logout-page px-4 py-8 max-w-lg mx-auto">
  <h1 class="text-3xl font-bold mb-4">Log out of your account</h1>
  <p class="mb-6 text-slate-600">Are you sure you want to log out?</p>

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

  <form onsubmit={handleSubmit} class="space-x-4">
    <button type="submit" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-900 transition" style="background-color: #dc2626; hover:bg-color: #ea580c; cursor: pointer;">Log Out</button>
    <button onclick={backToHome} class="px-4 py-2 bg-white text-black rounded" style="background-color: #cccccc; hover:bg-color: #aaaaaa; cursor: pointer;">Cancel</button>
  </form>
</section>