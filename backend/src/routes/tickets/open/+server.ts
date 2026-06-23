import { error, json, type RequestHandler } from "@sveltejs/kit";
import { db } from "../../../db/index.ts";
import { ticketsTable } from "../../../db/schema.ts";
import { eq } from "drizzle-orm";

export const GET: RequestHandler = async ({locals}) => {
    const userRole = locals.user?.role;
    const userId = locals.user?.userId;
    if (!userId || (userRole !== 'agent' && userRole !== 'admin')) {
        throw error(401, "Unauthenticated");
    }
    const dbHits = await db.select()
                            .from(ticketsTable)
                            .where(eq(ticketsTable.status, 'open'))
    return json({ tickets: dbHits })
}