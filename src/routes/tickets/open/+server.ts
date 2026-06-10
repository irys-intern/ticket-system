import { error, json, type RequestHandler } from "@sveltejs/kit";
import { db } from "../../../db/index.ts";
import { ticketsTable } from "../../../db/schema.ts";
import { or, eq } from "drizzle-orm";

export const GET: RequestHandler = async ({locals}) => {
    const userRole = locals.user?.role;
    const userId = locals.user?.userId;
    if (!userId || (userRole !== 'agent' && userRole !== 'admin')) {
        throw error(401, "Unauthenticated");
    }
    const dbHits = await db.select()
                            .from(ticketsTable)
                            .where(or(eq(ticketsTable.status, 'open'), eq(ticketsTable.status, 'reopened')))
    return json({ tickets: dbHits })
}