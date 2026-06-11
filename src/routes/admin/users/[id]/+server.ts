import { db } from "../../../../db/index.ts";
import { usersTable } from "../../../../db/schema.ts";
import { eq } from "drizzle-orm";
import { type RequestHandler, error, json } from "@sveltejs/kit";

export const GET: RequestHandler = async ({locals, params }) => {
    const user = locals.user;
    if (!user || !user.role || !user.userId || !(user.role === 'admin')) {
        throw error(403, "Forbidden")
    }
    const userHit = await db.select()
                            .from(usersTable)
                            .where(eq(usersTable.id, parseInt(params.id)))
                            .limit(1)
    if (userHit.length === 0) {
        throw error(404, "Not found")
    }
    return json({ok: true, user: userHit[0]})
}