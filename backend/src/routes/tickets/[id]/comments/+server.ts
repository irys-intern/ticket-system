import { error, json, type RequestHandler } from "@sveltejs/kit";
import { db } from "../../../../db/index.ts";
import { commentsTable, ticketsTable, userTable } from "../../../../db/schema.ts";
import { and, asc, eq } from "drizzle-orm";
import { createCommentSchema } from "../../../../utils/validators.ts";

async function getTicketForUser(ticketId: number, userId: string, role: string) {
    if (role === 'user') {
        const rows = await db.select().from(ticketsTable)
            .where(and(eq(ticketsTable.id, ticketId), eq(ticketsTable.createdBy, userId)))
            .limit(1);
        return rows[0];
    }
    const rows = await db.select().from(ticketsTable).where(eq(ticketsTable.id, ticketId)).limit(1);
    return rows[0];
}

export const GET: RequestHandler = async ({ locals, params }) => {
    const user = locals.user;
    if (!user || !user.role || !user.userId || user.role === 'guest') throw error(401, "Unauthenticated");
    if (!params.id) throw error(400, "No parameter")
    const ticketId = parseInt(params.id);
    if (Number.isNaN(ticketId)) throw error(400, "Invalid ticket id");

    const ticket = await getTicketForUser(ticketId, user.userId, user.role);
    if (!ticket) throw error(404, "Ticket not found");
    if (user.role !== 'admin' && user.userId !== ticket.assignedTo && user.userId !== ticket.createdBy) {
        throw error(403, "Forbidden");
    }
    const comments = await db
        .select({
            id: commentsTable.id,
            content: commentsTable.content,
            createdAt: commentsTable.createdAt,
            updatedAt: commentsTable.updatedAt,
            userId: commentsTable.userId,
            userName: userTable.name,
        })
        .from(commentsTable)
        .innerJoin(userTable, eq(commentsTable.userId, userTable.id))
        .where(eq(commentsTable.ticketId, ticketId))
        .orderBy(asc(commentsTable.createdAt));

    return json({ ok: true, comments });
};

export const POST: RequestHandler = async ({ locals, params, request, fetch }) => {
    const user = locals.user;
    if (!user || !user.role || !user.userId || user.role === 'guest') throw error(401, "Unauthenticated");
    if (!params.id) throw error(400, "No parameter")
    const ticketId = parseInt(params.id);
    if (Number.isNaN(ticketId)) throw error(400, "Invalid ticket id");

    const ticket = await getTicketForUser(ticketId, user.userId, user.role);
    if (!ticket) throw error(404, "Ticket not found");
    if (ticket.status === 'closed') throw error(409, "Ticket closed, no comments allowed.")
    if (user.role !== 'admin' && user.userId !== ticket.assignedTo && user.userId !== ticket.createdBy) {
        throw error(403, "Forbidden");
    }
    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) throw error(400, parsed.error.issues[0].message);

    const [comment] = await db.insert(commentsTable).values({
        ticketId,
        userId: user.userId,
        content: parsed.data.content,
    }).returning();

    await fetch('/admin/audit', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment added", ticketId: params.id }),
    });

    return json({ ok: true, comment }, { status: 201 });
};
