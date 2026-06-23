
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/admin" | "/admin/audit" | "/admin/users" | "/admin/users/[id]" | "/auth" | "/auth/login" | "/auth/logout" | "/auth/register" | "/create_admin" | "/create_ticket" | "/privacy" | "/tickets" | "/tickets/open" | "/tickets/[id]" | "/tickets/[id]/comments" | "/tickets/[id]/status";
		RouteParams(): {
			"/admin/users/[id]": { id: string };
			"/tickets/[id]": { id: string };
			"/tickets/[id]/comments": { id: string };
			"/tickets/[id]/status": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string | undefined };
			"/admin": { id?: string | undefined };
			"/admin/audit": Record<string, never>;
			"/admin/users": { id?: string | undefined };
			"/admin/users/[id]": { id: string };
			"/auth": Record<string, never>;
			"/auth/login": Record<string, never>;
			"/auth/logout": Record<string, never>;
			"/auth/register": Record<string, never>;
			"/create_admin": Record<string, never>;
			"/create_ticket": Record<string, never>;
			"/privacy": Record<string, never>;
			"/tickets": { id?: string | undefined };
			"/tickets/open": Record<string, never>;
			"/tickets/[id]": { id: string };
			"/tickets/[id]/comments": { id: string };
			"/tickets/[id]/status": { id: string }
		};
		Pathname(): "/" | "/admin/audit" | "/admin/users" | `/admin/users/${string}` & {} | "/auth/login" | "/auth/logout" | "/auth/register" | "/create_admin" | "/create_ticket" | "/privacy" | "/tickets" | "/tickets/open" | `/tickets/${string}` & {} | `/tickets/${string}/comments` & {} | `/tickets/${string}/status` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/favicon.svg" | string & {};
	}
}