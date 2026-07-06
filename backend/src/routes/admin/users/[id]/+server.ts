import { db } from "../../../../db/index.ts";
import { userTable } from "../../../../db/schema.ts";
import { eq } from "drizzle-orm";
import { type RequestHandler, error, json } from "@sveltejs/kit";

const FOREIGN_KEY_VIOLATION = '23503';

export const GET: RequestHandler = async ({locals, params }) => {
    const user = locals.user;
    if (!user || !user.role || !user.userId || user.role === 'guest') {
        throw error(403, "Forbidden")
    }
    let userHit;
    if (params.id === undefined) throw error(400, "No ID provided")
    if (user.role !== 'admin') {
        userHit = await db.select({name: userTable.name})
                          .from(userTable)
                          .where(eq(userTable.id, params.id))
                          .limit(1)
    } else {
        userHit = await db.select()
                          .from(userTable)
                          .where(eq(userTable.id, params.id))
                          .limit(1)
    }
    if (userHit.length === 0) {
        throw error(404, "Not found")
    }
    return json({ok: true, user: userHit[0]})
}

export const DELETE: RequestHandler = async ({ locals, params }) => {
    if (locals.user?.role !== 'admin') {
        throw error(401, "Unauthenticated")
    }
    if (params.id === undefined) throw error(400, "No ID provided")
    if (params.id === locals.user.userId) {
        throw error(400, "Cannot delete your own account")
    }

    try {
        const deleted = await db.delete(userTable).where(eq(userTable.id, params.id)).returning()
        if (deleted.length === 0) {
            throw error(404, "Not found")
        }
        return json({ ok: true })
    } catch (err) {
        if (err && typeof err === 'object' && 'code' in err && err.code === FOREIGN_KEY_VIOLATION) {
            throw error(409, "Cannot delete a user with existing tickets, comments, or assignments")
        }
        throw err
    }
}
