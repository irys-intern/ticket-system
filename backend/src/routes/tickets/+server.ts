import { error, json, type RequestHandler } from "@sveltejs/kit";
import { db } from "../../db/index.ts";
import { ticketsTable, userTable } from "../../db/schema.ts";
import { and, asc, count, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { ticketsQuerySchema } from "../../utils/validators.ts";

const TICKET_COLUMNS = {
    id: ticketsTable.id,
    title: ticketsTable.title,
    description: ticketsTable.description,
    status: ticketsTable.status,
    priority: ticketsTable.priority,
    category: ticketsTable.category,
    createdBy: ticketsTable.createdBy,
    assignedTo: ticketsTable.assignedTo,
    createdAt: ticketsTable.createdAt,
    updatedAt: ticketsTable.updatedAt,
};

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
        const { page, limit, q, status, sort } = parsed.data;

        const conditions = [];
        if (status) conditions.push(eq(ticketsTable.status, status));
        if (q) {
            const term = `%${q}%`;
            conditions.push(or(ilike(ticketsTable.title, term), ilike(ticketsTable.description, term)));
        }
        const whereClause = conditions.length ? and(...conditions) : undefined;

        // Sorting has to happen server-side across the whole result set, not just
        // the current page -- reordering only the 20 tickets already on the page
        // (as the frontend used to do) makes e.g. "sort by priority" look broken,
        // since higher-priority tickets sitting on page 2+ never surface.
        const assignedUser = alias(userTable, 'assigned_user');
        const reporterUser = alias(userTable, 'reporter_user');
        const orderByClause =
            sort === 'oldest' ? asc(ticketsTable.createdAt) :
            sort === 'priority' ? sql`CASE ${ticketsTable.priority} WHEN 'critical' THEN 3 WHEN 'high' THEN 2 WHEN 'medium' THEN 1 ELSE 0 END DESC` :
            sort === 'agent' ? sql`${assignedUser.name} ASC NULLS LAST` :
            sort === 'user' ? sql`${reporterUser.name} ASC NULLS LAST` :
            desc(ticketsTable.createdAt);

        const [tickets, [{ total }]] = await Promise.all([
            db.select(TICKET_COLUMNS).from(ticketsTable)
                .leftJoin(assignedUser, eq(ticketsTable.assignedTo, assignedUser.id))
                .leftJoin(reporterUser, eq(ticketsTable.createdBy, reporterUser.id))
                .where(whereClause)
                .orderBy(orderByClause)
                .limit(limit)
                .offset((page - 1) * limit),
            db.select({ total: count() }).from(ticketsTable).where(whereClause),
        ]);

        return json({ tickets, userRole, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) })
    } else {
        throw error(401, "Unauthenticated");
    }
}
