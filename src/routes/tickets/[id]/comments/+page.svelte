<script>
    import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	/**
   * @type {string | any[] | null | undefined}
   */
	let comments = $state([]);
	let newComment = $state('');
	let loading = $state(true);
	let error = $state(/** @type {string | null} */ (null));
    let ticketUrl = $state('')
	onMount(async () => {
        await fetchComments();
        const locationURL = new URL(window.location.href.toString()).pathname
        ticketUrl = locationURL.split('/').slice(0, locationURL.split('/').length-1).join('/')
	});

	async function fetchComments() {
		try {
			loading = true;
			const response = await fetch(location.href);
			if (!response.ok) throw new Error('Failed to fetch comments. Please reload. If this error persists, log out and log back in.');
			const data = await response.json();
			comments = data.comments || [];
			error = null;
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		} finally {
			loading = false;
		}
	}

	async function postComment() {
		if (!newComment.trim()) return;

		try {
			const response = await fetch(location.href, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ content: newComment })
			});

			if (!response.ok) throw new Error('Failed to post comment. Please reload. If this error persists, ensure the ticket is not closed and you are logged in.');
			
			newComment = '';
			await fetchComments();
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		}
	}
</script>
<a href={resolve('/'+ticketUrl, {})}>Back to ticket</a>
<div class="comments-container">
	<h2>Comments</h2>

	{#if loading}
		<p>Loading comments...</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else if !comments || comments.length === 0}
		<p>No comments yet.</p>
	{:else}
		<div class="comments-list">
			{#each comments as comment (comment.id)}
				<div class="comment">
					<div class="comment-header">
						<strong>{comment.userName}</strong>
						<span class="date">{new Date(comment.createdAt).toLocaleString()}</span>
					</div>
					<p>{comment.content}</p>
				</div>
			{/each}
		</div>
	{/if}

	<div class="comment-form">
		<textarea
			bind:value={newComment}
			placeholder="Write a comment..."
			rows="4" disabled={loading}
		></textarea>
		<button onclick={postComment} disabled={(!newComment.trim()) || loading}>Post Comment</button>
	</div>
</div>

<style>
	.comments-container {
		padding: 1rem;
		max-width: 800px;
		margin: 0 auto;
	}

	.comments-list {
		margin-bottom: 2rem;
	}

	.comment {
		border: 1px solid #ddd;
		padding: 1rem;
		margin-bottom: 1rem;
		border-radius: 4px;
		background-color: #f9f9f9;
	}

	.comment-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.date {
		font-size: 0.875rem;
		color: #666;
	}

	.comment-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	textarea {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-family: inherit;
		resize: vertical;
	}

	button {
		padding: 0.5rem 1rem;
		background-color: #0066cc;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: bold;
	}

	button:hover:not(:disabled) {
		background-color: #0052a3;
	}

	button:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	.error {
		color: #d32f2f;
		padding: 1rem;
		background-color: #ffebee;
		border-radius: 4px;
	}
</style>
