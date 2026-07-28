import { error, json, type RequestHandler } from "@sveltejs/kit";
import { db } from "../../db/index.ts";
import { ticketsTable } from "../../db/schema.ts";
import { and, count, desc, eq, ilike, ne, or } from "drizzle-orm";
import { ticketsQuerySchema } from "../../utils/validators.ts";

export const GET: RequestHandler = async ({ locals, url }) => {
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
        const parsed = ticketsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) {
            throw error(400, "Invalid query parameters");
        }
        const { page, limit, q, status } = parsed.data;

        const conditions = [];
        if (status) conditions.push(eq(ticketsTable.status, status));
        if (q) {
            const term = `%${q}%`;
            conditions.push(or(ilike(ticketsTable.title, term), ilike(ticketsTable.description, term)));
        }
        const whereClause = conditions.length ? and(...conditions) : undefined;

        const [tickets, [{ total }]] = await Promise.all([
            db.select().from(ticketsTable)
                .where(whereClause)
                .orderBy(desc(ticketsTable.createdAt))
                .limit(limit)
                .offset((page - 1) * limit),
            db.select({ total: count() }).from(ticketsTable).where(whereClause),
        ]);

        return json({ tickets, userRole, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) })
    } else {
        throw error(401, "Unauthenticated");
    }
}
