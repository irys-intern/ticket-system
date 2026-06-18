import { eq } from "drizzle-orm";
import { db } from "../../../db/index.ts";
import { auditEventsTable, usersTable } from "../../../db/schema.ts";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals, request, fetch }) => {
    const user = locals.user
    const data = await request.headers;
    const ticket_id = data.get("X-Ticket-Id")
    if (ticket_id) {
        const ticket = await (await fetch(`/tickets/${ticket_id}`)).json();
        if (user?.role === 'user') {
            if (ticket.createdBy.toString() !== user.userId) {
                throw error(403, "Forbidden");
            }
        } else if (user?.role === 'agent') {
            if (ticket.assignedTo.toString() !== user.userId) {
                throw error(403, "Forbidden")
            }
        }
        return json({audits: await db.select().from(auditEventsTable).where(eq(auditEventsTable.ticketId, parseInt(ticket_id)))})
    }
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