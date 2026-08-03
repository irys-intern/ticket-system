import { db } from "../../../../db/index.ts";
import { assignmentsTable, auditEventsTable, commentsTable, notificationsTable, ticketsTable, userTable } from "../../../../db/schema.ts";
import { and, eq, inArray, ne, or } from "drizzle-orm";
import { type RequestHandler, error, json } from "@sveltejs/kit";
import { DELETED_USER_ID, ensureDeletedUserExists } from "../../../../lib/deletedUser.ts";
import { getRedisSafe } from "../../../../lib/redis.ts";
import { invalidateCache } from "../../../../lib/cache.ts";
import {
    DASHBOARD_HOME_ADMIN_CACHE_KEY,
    dashboardHomeAgentCacheKey,
    dashboardHomeUserCacheKey,
} from "../../../../lib/dashboardCache.ts";

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

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
    if (locals.user?.role !== 'admin') {
        throw error(401, "Unauthenticated")
    }
    if (params.id === undefined) throw error(400, "No ID provided")
    if (params.id === locals.user.userId) {
        throw error(400, "Cannot deactivate your own account")
    }
    if (params.id === DELETED_USER_ID) {
        throw error(400, "Cannot modify the system placeholder user")
    }

    const body = await request.json()
    if (typeof body.active !== 'boolean') {
        throw error(400, "Malformed request")
    }

    const [updated] = await db.update(userTable)
        .set({ active: body.active })
        .where(eq(userTable.id, params.id))
        .returning()

    if (!updated) {
        throw error(404, "Not found")
    }

    return json({ ok: true, user: updated })
}

export const DELETE: RequestHandler = async ({ locals, params }) => {
    if (locals.user?.role !== 'admin') {
        throw error(404, "Not Found")
    }
    if (params.id === undefined) throw error(400, "No ID provided")
    if (params.id === locals.user.userId) {
        throw error(400, "Cannot delete your own account")
    }
    if (params.id === DELETED_USER_ID) {
        throw error(400, "Cannot delete the system placeholder user")
    }
    const targetId = params.id

    try {
        await ensureDeletedUserExists()

        const deleted = await db.transaction(async (tx) => {
            const affectedTickets = await tx
                .select({ id: ticketsTable.id })
                .from(ticketsTable)
                .where(or(eq(ticketsTable.createdBy, targetId), eq(ticketsTable.assignedTo, targetId)))

            // Reassign historical records to the placeholder so deleting the user doesn't
            // orphan referential integrity, then close any of their tickets not already closed.
            await tx.update(ticketsTable).set({ createdBy: DELETED_USER_ID }).where(eq(ticketsTable.createdBy, targetId))
            await tx.update(ticketsTable).set({ assignedTo: DELETED_USER_ID }).where(eq(ticketsTable.assignedTo, targetId))
            if (affectedTickets.length > 0) {
                await tx.update(ticketsTable)
                    .set({ status: 'closed' })
                    .where(and(
                        inArray(ticketsTable.id, affectedTickets.map((t) => t.id)),
                        ne(ticketsTable.status, 'closed'),
                    ))
            }

            await tx.update(commentsTable).set({ userId: DELETED_USER_ID }).where(eq(commentsTable.userId, targetId))
            await tx.update(auditEventsTable).set({ userId: DELETED_USER_ID }).where(eq(auditEventsTable.userId, targetId))
            await tx.update(assignmentsTable).set({ userId: DELETED_USER_ID }).where(eq(assignmentsTable.userId, targetId))
            await tx.delete(notificationsTable).where(eq(notificationsTable.userId, targetId))

            return tx.delete(userTable).where(eq(userTable.id, targetId)).returning()
        })

        if (deleted.length === 0) {
            throw error(404, "Not found")
        }

        await invalidateCache(
            await getRedisSafe(),
            DASHBOARD_HOME_ADMIN_CACHE_KEY,
            dashboardHomeUserCacheKey(targetId),
            dashboardHomeAgentCacheKey(targetId),
        )

        return json({ ok: true })
    } catch (err) {
        // drizzle-orm wraps driver errors in a DrizzleQueryError, nesting the real
        // PostgresError (with the SQLSTATE `code`) at `.cause` rather than on `err` itself.
        const cause = err && typeof err === 'object' && 'cause' in err ? err.cause : err
        if (cause && typeof cause === 'object' && 'code' in cause && cause.code === FOREIGN_KEY_VIOLATION) {
            throw error(409, "Cannot delete a user with existing tickets, comments, or assignments")
        }
        throw err
    }
}
