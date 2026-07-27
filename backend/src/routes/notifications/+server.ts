import { error, json, type RequestHandler } from "@sveltejs/kit";
import { db } from "../../db/index.ts";
import { notificationsTable } from "../../db/schema.ts";
import { desc, eq } from "drizzle-orm";

export const GET: RequestHandler = async ({ locals }) => {
    const userId = locals.user?.userId;
    if (!userId) {
        throw error(401, "Unauthenticated");
    }
    const notifications = await db.select()
        .from(notificationsTable)
        .where(eq(notificationsTable.userId, userId))
        .orderBy(desc(notificationsTable.createdAt))
        .limit(30);
    return json({ notifications });
}
