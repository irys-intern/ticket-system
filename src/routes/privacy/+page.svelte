<script>
    import { resolve } from '$app/paths'
</script>
<svelte:head>
	<title>Privacy Policy</title>
</svelte:head>

<div class="privacy-container">
    <a href={resolve("/", {})}>Return home</a>
	<h1>Privacy Policy</h1>

	<section>
		<h2>Introduction</h2>
		<p>
			We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your
			information.
		</p>
	</section>

	<section>
		<h2>Information We Collect</h2>
		<p>We may collect the following information:</p>
		<ul>
			<li>Your name and email address</li>
			<li>Account information and preferences</li>
			<li>Usage data and analytics</li>
			<li>Device and browser information</li>
		</ul>
	</section>

	<section>
		<h2>How We Use Your Information</h2>
		<p>We use the information we collect to:</p>
		<ul>
			<li>Provide and maintain our services</li>
			<li>Improve user experience</li>
			<li>Send administrative notifications</li>
			<li>Comply with legal obligations</li>
		</ul>
	</section>

	<section>
		<h2>Data Security</h2>
		<p>
			We implement appropriate technical and organizational measures to protect your personal information against
			unauthorized access, alteration, disclosure, or destruction.
		</p>
	</section>

	<section>
		<h2>Contact Us</h2>
		<p>If you have questions about this Privacy Policy, please contact us at info@irystechnologies.com</p>
	</section>
</div>

<style>
	.privacy-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		line-height: 1.6;
	}

	h1 {
		color: #333;
		margin-bottom: 2rem;
	}

	h2 {
		color: #555;
		margin-top: 1.5rem;
		margin-bottom: 1rem;
	}

	section {
		margin-bottom: 2rem;
	}

	ul {
		margin-left: 1.5rem;
	}

	li {
		margin-bottom: 0.5rem;
	}

	p {
		color: #666;
	}
</style>
