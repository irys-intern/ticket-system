import { db } from "../../../../db/index.ts";
import { userTable } from "../../../../db/schema.ts";
import { eq } from "drizzle-orm";
import { type RequestHandler, error, json } from "@sveltejs/kit";

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
