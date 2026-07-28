import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "../../../db/index.ts";
import { auditEventsTable, notificationsTable, ticketsTable, userTable } from "../../../db/schema.ts";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { Ticket } from "../../../types/index.ts";
import { redis } from "../../../lib/redis.ts";
import { invalidateCache } from "../../../lib/cache.ts";
import {
    DASHBOARD_HOME_ADMIN_CACHE_KEY,
    dashboardHomeAgentCacheKey,
    dashboardHomeUserCacheKey,
} from "../../../lib/dashboardCache.ts";
import { AUDIT_ACTIONS, auditQuerySchema } from "../../../utils/validators.ts";

export const GET: RequestHandler = async ({ locals, request, fetch, url }) => {
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

    const parsed = auditQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
        throw error(400, "Invalid query parameters");
    }
    const { page, limit, q, action } = parsed.data;

    const conditions = [];
    if (action) conditions.push(eq(auditEventsTable.action, action));
    if (q) {
        const term = `%${q}%`;
        const matchingUsers = await db.select({ id: userTable.id }).from(userTable)
            .where(or(ilike(userTable.name, term), ilike(userTable.email, term)));
        const orConditions = [ilike(auditEventsTable.action, term), sql`${auditEventsTable.ticketId}::text ILIKE ${term}`];
        if (matchingUsers.length) orConditions.push(inArray(auditEventsTable.userId, matchingUsers.map((u) => u.id)));
        conditions.push(or(...orConditions)!);
    }
    const whereClause = conditions.length ? and(...conditions) : undefined;

    try {
        const [audit_events, [{ total }], users] = await Promise.all([
            db.select().from(auditEventsTable)
                .where(whereClause)
                .orderBy(desc(auditEventsTable.id))
                .limit(limit)
                .offset((page - 1) * limit),
            db.select({ total: count() }).from(auditEventsTable).where(whereClause),
            db.select().from(userTable),
        ]);
        return json({
            events: audit_events,
            users,
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        })
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
    if (!AUDIT_ACTIONS.includes(action)) {
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
        const [ticket] = await db.select().from(ticketsTable).where(eq(ticketsTable.id, ticketId)).limit(1)
        if (ticket) {
            const homeKeys = [DASHBOARD_HOME_ADMIN_CACHE_KEY, dashboardHomeUserCacheKey(ticket.createdBy)]
            if (ticket.assignedTo) homeKeys.push(dashboardHomeAgentCacheKey(ticket.assignedTo))
            await invalidateCache(redis, ...homeKeys)
            await notifyForAuditEvent(action, ticket, userId)
        }
        return json({ok: true})
    } catch (err) {
        return json({error: err})
    }
}

// The rest of the app funnels every ticket mutation through this endpoint to log
// an audit event, so it's also the single choke point for deciding who to notify.
async function notifyForAuditEvent(action: string, ticket: typeof ticketsTable.$inferSelect, actingUserId: string) {
    const ticketId = ticket.id
    let message: string | null = null
    const recipients = new Set<string>()

    if (action === 'ticket assigned' && ticket.assignedTo) {
        message = `You were assigned to ticket #${ticketId}: ${ticket.title}`
        recipients.add(ticket.assignedTo)
    } else if (action === 'status changed') {
        message = `Ticket #${ticketId} status changed to ${ticket.status}`
        if (ticket.createdBy !== actingUserId) recipients.add(ticket.createdBy)
    } else if (action === 'comment added') {
        message = `New comment on ticket #${ticketId}: ${ticket.title}`
        const other = actingUserId === ticket.createdBy ? ticket.assignedTo : ticket.createdBy
        if (other && other !== actingUserId) recipients.add(other)
    } else if (action === 'ticket updated') {
        message = `Ticket #${ticketId} was updated: ${ticket.title}`
        const other = actingUserId === ticket.createdBy ? ticket.assignedTo : ticket.createdBy
        if (other && other !== actingUserId) recipients.add(other)
    }

    if (!message || recipients.size === 0) return
    await db.insert(notificationsTable).values(
        Array.from(recipients).map((recipientId) => ({
            userId: recipientId,
            message: message as string,
            link: `/tickets/${ticketId}`,
        })),
    )
}
