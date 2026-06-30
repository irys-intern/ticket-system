import { error, json, type RequestHandler } from "@sveltejs/kit";
import { db } from "../../../../db/index.ts";
import { ticketsTable } from "../../../../db/schema.ts";
import { and, eq } from "drizzle-orm";

export const GET: RequestHandler = async ({locals, params}) => {
    const user = locals.user;
    if (!user || !user.role || !user.userId || user.role==='guest') throw error(401, "Unauthenticated");
    let ticket;
    if (!params.id) throw error(400, "No params.id")
    if (user.role === 'user') {
        ticket = await db.select()
                         .from(ticketsTable)
                         .where(and(
                            eq(ticketsTable.createdBy, user.userId),
                            eq(ticketsTable.id, parseInt(params.id))
                        )).limit(1)
    } else {
        ticket = await db.select()
                         .from(ticketsTable)
                         .where(eq(ticketsTable.id, parseInt(params.id)))
                         .limit(1)
    }
    if (ticket.length === 0) {
        return json({ok: false, errors: ["No ticket found"]})
    }
    return json({ok: true, ticket_status: ticket[0].status})
}   