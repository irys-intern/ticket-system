import { and, count, eq, ilike, ne, or } from "drizzle-orm";
import { db } from "../../../db/index.ts";
import { userTable } from "../../../db/schema.ts";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import { DELETED_USER_ID } from "../../../lib/deletedUser.ts";
import { usersQuerySchema } from "../../../utils/validators.ts";

export const GET: RequestHandler = async ({ locals, url }) => {
    if (locals.user?.role !== 'admin') {
        throw error(401, "Unauthenticated")
    }
    const parsed = usersQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
        throw error(400, "Invalid query parameters");
    }
    const { page, limit, q } = parsed.data;

    const conditions = [ne(userTable.id, DELETED_USER_ID)];
    if (q) {
        const term = `%${q}%`;
        conditions.push(or(ilike(userTable.name, term), ilike(userTable.email, term))!);
    }
    const whereClause = and(...conditions);

    const [users, [{ total }]] = await Promise.all([
        db.select().from(userTable)
            .where(whereClause)
            .orderBy(userTable.id)
            .limit(limit)
            .offset((page - 1) * limit),
        db.select({ total: count() }).from(userTable).where(whereClause),
    ]);

    return json({ users, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
}

export const POST: RequestHandler = async ({ request, locals }) => {
    if (locals.user?.role !== 'admin') {
        throw error(401, "Unauthenticated")
    }
    const data = await request.json()
    const manageUserId = data.manageUser
    const modification = data.modification

    let updatedUser;
    if ((!manageUserId) || (!modification)) {
        throw error(400, "Malformed request")
    }
    if (manageUserId === locals.user.userId) {
        throw error(400, "Cannot change your own access level")
    }
    if ((modification === 'user' || modification === 'agent' || modification === 'admin') && manageUserId) {
        updatedUser = await db.update(userTable).set({role: modification}).where(eq(userTable.id, manageUserId)).returning()
    }
    return json({success: !!updatedUser})
}
