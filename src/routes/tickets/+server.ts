import { error, json, type RequestHandler } from "@sveltejs/kit";
import { db } from "../../db/index.ts";
import { ticketsTable } from "../../db/schema.ts";
import { eq } from "drizzle-orm";

export const GET: RequestHandler = async ({locals}) => {
    const userRole = locals.user?.role;
    const userId = locals.user?.userId;
    if (!userId) {
        throw error(401, "Unauthenticated");
    }
    if (userRole === 'user') {
        const dbHits = await db.select()
                         .from(ticketsTable)
                         .where(eq(ticketsTable.createdBy, parseInt(userId)))
        return json({ tickets: dbHits })
    } else if (userRole === 'agent') {
        const dbHits = await db.select()
                               .from(ticketsTable)
                               .where(eq(ticketsTable.assignedTo, parseInt(userId)))
        return json({ tickets: dbHits })
    } else if (userRole === 'admin') {
        const dbHits = await db.select()
                               .from(ticketsTable)
        return json({ tickets: dbHits })
    } else {
        throw error(401, "Unauthenticated");
    }
}