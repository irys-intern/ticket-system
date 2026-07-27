import type { LayoutServerLoad } from "./$types";
import { env } from '$env/dynamic/private';

const backendUrl = () => env.BACKEND_URL ?? 'http://localhost:5172';

export const load: LayoutServerLoad = async ({ locals }) => {
    let siteIconUrl = '/favicon.svg';
    try {
        const res = await fetch(`${backendUrl()}/settings`);
        if (res.ok) {
            const data = await res.json();
            siteIconUrl = data.siteIconUrl ?? siteIconUrl;
        }
    } catch {
        // fall back to the default icon if the backend/settings are unreachable
    }
    return { user: locals.user, siteIconUrl }
}