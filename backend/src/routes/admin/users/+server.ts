import { eq } from "drizzle-orm";
import { db } from "../../../db/index.ts";
import { userTable } from "../../../db/schema.ts";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals }) => {
    if (locals.user?.role !== 'admin') {
        throw error(401, "Unauthenticated")
    }
    const dbHits = await db.select().from(userTable)
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
    }
    return json({success: !!updatedUser})
}
