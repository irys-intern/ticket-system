// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			session: { userId: string; email: string; name: string, role: string } | null;
			user: { userId: string; email: string; name: string, role: string } | null;
		}
	}
}

export {};
