import { eq, ne } from "drizzle-orm";
import { db } from "../../../db/index.ts";
import { userTable } from "../../../db/schema.ts";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import { redis } from "../../../lib/redis.ts";
import { getOrSetCache, invalidateCache } from "../../../lib/cache.ts";
import { getDashboardCacheTtlSeconds, DASHBOARD_USERS_CACHE_KEY } from "../../../lib/dashboardCache.ts";
import { DELETED_USER_ID } from "../../../lib/deletedUser.ts";

export const GET: RequestHandler = async ({ locals }) => {
    if (locals.user?.role !== 'admin') {
        throw error(401, "Unauthenticated")
    }
    const dbHits = await getOrSetCache(
        redis,
        DASHBOARD_USERS_CACHE_KEY,
        await getDashboardCacheTtlSeconds(),
        () => db.select().from(userTable).where(ne(userTable.id, DELETED_USER_ID)),
    );
    return json({users: dbHits});
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
        await invalidateCache(redis, DASHBOARD_USERS_CACHE_KEY);
    }
    return json({success: !!updatedUser})
}
