import { error, json, type RequestHandler } from "@sveltejs/kit";
import { db } from "../../db/index.ts";
import { ticketsTable } from "../../db/schema.ts";
import { and, eq, ne } from "drizzle-orm";
import { redis } from "../../lib/redis.ts";
import { getOrSetCache } from "../../lib/cache.ts";
import { DASHBOARD_CACHE_TTL_SECONDS, DASHBOARD_TICKETS_CACHE_KEY } from "../../lib/dashboardCache.ts";

export const GET: RequestHandler = async ({locals}) => {
    const userRole = locals.user?.role;
    const userId = locals.user?.userId;
    if (!userId) {
        throw error(401, "Unauthenticated");
    }
    if (userRole === 'user') {
        const dbHits = await db.select()
                         .from(ticketsTable)
                         .where(eq(ticketsTable.createdBy, userId))
        return json({ tickets: dbHits, userRole })
    } else if (userRole === 'agent') {
        const dbHits = await db.select()
                               .from(ticketsTable)
                               .where(and(eq(ticketsTable.assignedTo, userId), ne(ticketsTable.status, 'closed')))
        return json({ tickets: dbHits, userRole})
    } else if (userRole === 'admin') {
        const dbHits = await getOrSetCache(
            redis,
            DASHBOARD_TICKETS_CACHE_KEY,
            DASHBOARD_CACHE_TTL_SECONDS,
            () => db.select().from(ticketsTable),
        );
        return json({ tickets: dbHits, userRole })
    } else {
        throw error(401, "Unauthenticated");
    }
}
