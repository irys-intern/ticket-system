import { error, json, type RequestHandler } from "@sveltejs/kit";
import { db } from "../../../db/index.ts";
import { notificationsTable } from "../../../db/schema.ts";
import { and, eq } from "drizzle-orm";

export const POST: RequestHandler = async ({ locals }) => {
    const userId = locals.user?.userId;
    if (!userId) {
        throw error(401, "Unauthenticated");
    }
    await db.update(notificationsTable)
        .set({ read: true })
        .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false)));
    return json({ ok: true });
}
