import { json, type RequestHandler } from "@sveltejs/kit";
import { getSettings } from "../../lib/settings.ts";

// Public subset of settings needed to render pages for any visitor (including guests),
// e.g. the header logo and the ticket-creation NLP debounce. Admin-only internals like
// the dashboard cache TTL are intentionally excluded — see /admin/settings for those.
export const GET: RequestHandler = async () => {
    const settings = await getSettings();
    return json({
        siteIconUrl: settings.siteIconUrl,
        nlpDebounceMs: settings.nlpDebounceMs,
    });
}
