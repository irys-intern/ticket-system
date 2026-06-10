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

export const POST: RequestHandler = async ({ request, locals }) => {
    const user = locals.user
    if (!user || !user.role || !user.userId || (user.role === 'guest')) {
        throw error(403, "Forbidden")
    }
    const req = await request.json()
    const action = req.action
    const allowedActions = ["ticket created", "ticket updated", "ticket assigned", "ticket reassigned", "status changed", "comment added"] as const
    if (!allowedActions.includes(action)) {
        throw error(400, "Bad action")
    }
    const ticketId = Number(req.ticketId)
    if (!Number.isFinite(ticketId)) {
        throw error(400, "Bad ticketId")
    }
    const userId = Number(user.userId)
    if (!Number.isFinite(userId)) {
        throw error(400, "Bad userId")
    }
    try {
        await db.insert(auditEventsTable)
            .values({ticketId, userId, action})
        return json({ok: true})
    } catch (error) {
        return json({error})
    }
}