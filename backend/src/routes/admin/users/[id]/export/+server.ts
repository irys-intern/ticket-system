import { eq } from "drizzle-orm";
import { db } from "../../../../../db/index.ts";
import { auditEventsTable, commentsTable, notificationsTable, ticketsTable, userTable } from "../../../../../db/schema.ts";
import { error, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals, params }) => {
    if (locals.user?.role !== 'admin') {
        throw error(404, "Not Found");
    }
    if (params.id === undefined) throw error(400, "No ID provided");
    const targetId = params.id;

    const [user] = await db.select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        role: userTable.role,
        active: userTable.active,
        createdAt: userTable.createdAt,
    }).from(userTable).where(eq(userTable.id, targetId)).limit(1);

    if (!user) {
        throw error(404, "Not found");
    }

    const [createdTickets, assignedTickets, comments, auditEvents, notifications] = await Promise.all([
        db.select().from(ticketsTable).where(eq(ticketsTable.createdBy, targetId)),
        db.select().from(ticketsTable).where(eq(ticketsTable.assignedTo, targetId)),
        db.select().from(commentsTable).where(eq(commentsTable.userId, targetId)),
        db.select().from(auditEventsTable).where(eq(auditEventsTable.userId, targetId)),
        db.select().from(notificationsTable).where(eq(notificationsTable.userId, targetId)),
    ]);

    const payload = {
        exportedAt: new Date().toISOString(),
        user,
        createdTickets,
        assignedTickets,
        comments,
        auditEvents,
        notifications,
    };

    return new Response(JSON.stringify(payload, null, 2), {
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Disposition": `attachment; filename="user-${targetId}-export.json"`,
        },
    });
};
