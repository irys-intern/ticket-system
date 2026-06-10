import { db } from "../../../db/index.ts";
import { auditEventsTable, usersTable } from "../../../db/schema.ts";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals }) => {
    const user = locals.user
    if (!user || !user.role || !user.userId || (user.role !== 'admin')) {
        throw error(403, "Forbidden")
    }
    try {
    const audit_events = await db.select()
                                 .from(auditEventsTable);
    const users = await db.select()
                          .from(usersTable);
    return json({events: audit_events, users: users})
    } catch (error) {
        return json({error})
    }
}