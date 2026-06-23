import { eq } from "drizzle-orm";
import { db } from "../../../db/index.ts";
import { auditEventsTable, userTable } from "../../../db/schema.ts";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { Ticket } from "../../../types/index.ts";

export const GET: RequestHandler = async ({ locals, request, fetch }) => {
    const user = locals.user
    const ticket_id = request.headers.get("X-Ticket-Id")
    if (ticket_id) {
        const ticket: Ticket = await (await fetch(`/tickets/${ticket_id}`)).json();
        if (user?.role === 'user') {
            if (ticket.createdBy !== user.userId) {
                throw error(403, "Forbidden");
            }
        } else if (user?.role === 'agent') {
            if (ticket.assignedTo !== user.userId) {
                throw error(403, "Forbidden")
            }
        }
        return json({audits: await db.select().from(auditEventsTable).where(eq(auditEventsTable.ticketId, parseInt(ticket_id)))})
    }
    if (!user || !user.role || !user.userId || (user.role !== 'admin')) {
        throw error(403, "Forbidden")
    }
    try {
        const audit_events = await db.select().from(auditEventsTable);
        const users = await db.select().from(userTable);
        return json({events: audit_events, users: users})
    } catch (err) {
        return json({error: err})
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
    const userId = user.userId
    if (!userId) {
        throw error(400, "Bad userId")
    }
    try {
        await db.insert(auditEventsTable).values({ticketId, userId, action})
        return json({ok: true})
    } catch (err) {
        return json({error: err})
    }
}
