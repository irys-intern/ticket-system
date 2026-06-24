
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
		RouteId(): "/" | "/admin" | "/admin/audit" | "/admin/stats" | "/admin/users" | "/auth" | "/auth/login" | "/auth/logout" | "/auth/register" | "/create_admin" | "/create_ticket" | "/privacy" | "/tickets" | "/tickets/open" | "/tickets/[id]" | "/tickets/[id]/comments";
		RouteParams(): {
			"/tickets/[id]": { id: string };
			"/tickets/[id]/comments": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string | undefined };
			"/admin": Record<string, never>;
			"/admin/audit": Record<string, never>;
			"/admin/stats": Record<string, never>;
			"/admin/users": Record<string, never>;
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
			"/tickets/[id]/comments": { id: string }
		};
		Pathname(): "/" | "/admin/audit" | "/admin/stats" | "/admin/users" | "/auth/login" | "/auth/logout" | "/auth/register" | "/create_admin" | "/create_ticket" | "/privacy" | "/tickets" | "/tickets/open" | `/tickets/${string}` & {} | `/tickets/${string}/comments` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/favicon.svg" | string & {};
	}
}