import { error, json, type RequestHandler } from "@sveltejs/kit";
import { db } from "../../../db/index.ts";
import { notificationsTable } from "../../../db/schema.ts";
import { and, count, eq } from "drizzle-orm";

export const GET: RequestHandler = async ({ locals }) => {
    const userId = locals.user?.userId;
    if (!userId) {
        throw error(401, "Unauthenticated");
    }
    const [row] = await db.select({ count: count() })
        .from(notificationsTable)
        .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false)));
    return json({ count: row?.count ?? 0 });
}
