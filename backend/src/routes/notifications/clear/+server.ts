import { error, json, type RequestHandler } from "@sveltejs/kit";
import { db } from "../../../db/index.ts";
import { notificationsTable } from "../../../db/schema.ts";
import { eq } from "drizzle-orm";

export const POST: RequestHandler = async ({ locals }) => {
    const userId = locals.user?.userId;
    if (!userId) {
        throw error(401, "Unauthenticated");
    }
    await db.delete(notificationsTable)
        .where(eq(notificationsTable.userId, userId));
    return json({ ok: true });
}
