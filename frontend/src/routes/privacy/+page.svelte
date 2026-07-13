<title>Privacy Policy</title>
<script>
  import { resolve } from '$app/paths';
  import BackLink from '$lib/components/BackLink.svelte';
</script>

<svelte:head>
  <title>Privacy Policy</title>
</svelte:head>

<div class="space-y-4 max-w-2xl">
  <div>
    <BackLink href={resolve('/')} />
  </div>

  <div>
    <h1 class="text-2xl font-bold tracking-tight">Privacy Policy</h1>
    <p class="text-sm text-muted-foreground">How we collect, use, and protect your information.</p>
  </div>

  <div class="prose prose-sm max-w-none space-y-6 text-foreground">
    <section>
      <h2 class="text-foreground font-semibold">Introduction</h2>
      <p class="text-muted-foreground">
        We are committed to protecting your privacy. This Privacy Policy explains how we collect,
        use, and safeguard your information.
      </p>
    </section>

    <section>
      <h2 class="text-foreground font-semibold">Site Ownership</h2>
      <p class="text-muted-foreground">
        This website is not maintained by Irys Technologies. Eli Friedman
        (<a href="mailto:elimfriedman22@gmail.com" class="text-muted-foreground underline underline-offset-4 hover:text-foreground">elimfriedman22@gmail.com</a>)
        is solely responsible for its operation and content.
      </p>
    </section>

    <section>
      <h2 class="text-foreground font-semibold">Information We Collect</h2>
      <p class="text-muted-foreground">We may collect the following information:</p>
      <ul class="list-disc list-inside text-muted-foreground space-y-1 mt-2">
        <li>Your name and email address</li>
        <li>Account information and preferences</li>
        <li>Usage data and analytics</li>
        <li>Device and browser information</li>
      </ul>
    </section>

    <section>
      <h2 class="text-foreground font-semibold">How We Use Your Information</h2>
      <p class="text-muted-foreground">We use the information we collect to:</p>
      <ul class="list-disc list-inside text-muted-foreground space-y-1 mt-2">
        <li>Provide and maintain our services</li>
        <li>Improve user experience</li>
        <li>Send administrative notifications</li>
        <li>Comply with legal obligations</li>
      </ul>
    </section>
    
    <section>
      <h2 class="text-foreground font-semibold">Natural Language Processing</h2>
      <p class="text-muted-foreground">
        When you create a ticket, its details may be processed to detect a priority level. This processing does not include any sensitive data.
      </p>
    </section>

    <section>
      <h2 class="text-foreground font-semibold">Data Security</h2>
      <p class="text-muted-foreground">
        We implement appropriate technical and organizational measures to protect your personal
        information against unauthorized access, alteration, disclosure, or destruction.
      </p>
    </section>

    <section>
      <h2 class="text-foreground font-semibold">Credits</h2>
      <p class="text-muted-foreground">
        Built by Eli Friedman under supervision of Joshua Duque of Irys Technologies.
      </p>
    </section>

    <section>
      <h2 class="text-foreground font-semibold">Contact Us</h2>
      <p class="text-muted-foreground">
        If you have questions about this Privacy Policy, please contact us at
        <a href="mailto:elimfriedman22@gmail.com" class="text-muted-foreground underline underline-offset-4 hover:text-foreground">elimfriedman22@gmail.com</a>.
      </p>
    </section>
  </div>
</div>
