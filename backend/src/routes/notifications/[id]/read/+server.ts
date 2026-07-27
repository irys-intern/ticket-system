import { error, json, type RequestHandler } from "@sveltejs/kit";
import { db } from "../../../../db/index.ts";
import { notificationsTable } from "../../../../db/schema.ts";
import { and, eq } from "drizzle-orm";

export const POST: RequestHandler = async ({ locals, params }) => {
    const userId = locals.user?.userId;
    if (!userId) {
        throw error(401, "Unauthenticated");
    }
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
        throw error(400, "Invalid notification id");
    }
    await db.update(notificationsTable)
        .set({ read: true })
        .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));
    return json({ ok: true });
}
