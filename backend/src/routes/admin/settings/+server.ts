import { error, json, type RequestHandler } from "@sveltejs/kit";
import { getSettings, updateSettings } from "../../../lib/settings.ts";
import { updateSettingsSchema } from "../../../utils/validators.ts";

export const GET: RequestHandler = async ({ locals }) => {
    if (locals.user?.role !== 'admin') {
        throw error(401, "Unauthenticated");
    }
    const settings = await getSettings();
    return json({ settings });
}

export const PUT: RequestHandler = async ({ locals, request }) => {
    if (locals.user?.role !== 'admin' || !locals.user.userId) {
        throw error(401, "Unauthenticated");
    }
    const body = await request.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
        throw error(400, parsed.error.issues[0].message);
    }
    const settings = await updateSettings(parsed.data, locals.user.userId);
    return json({ settings });
}
