import type { RequestEvent } from '@sveltejs/kit';
import { db } from '../db/index.ts';
import { ticketsTable, userTable } from '../db/schema.ts';
import { eq, and, ne, not, or } from 'drizzle-orm';
import { redis } from '../lib/redis.ts';
import { getOrSetCache } from '../lib/cache.ts';
import {
  getDashboardCacheTtlSeconds,
  DASHBOARD_HOME_ADMIN_CACHE_KEY,
  dashboardHomeAgentCacheKey,
  dashboardHomeUserCacheKey,
} from '../lib/dashboardCache.ts';
import { DELETED_USER_ID } from '../lib/deletedUser.ts';

export async function GET({ locals }: RequestEvent) {
  const user = locals.user;
  const cacheTtl = await getDashboardCacheTtlSeconds();
  let openUserTickets: { id: number; title: string; description: string; status: "open" | "in_progress" | "waiting_for_response" | "resolved" | "closed"; priority: "low" | "medium" | "high" | "critical"; category: "bug" | "feature_request" | "support" | "other"; createdBy: string; assignedTo: string | null; createdAt: Date; updatedAt: Date; }[] = []
  let resolvedUserTickets: { id: number; title: string; description: string; status: "open" | "in_progress" | "waiting_for_response" | "resolved" | "closed"; priority: "low" | "medium" | "high" | "critical"; category: "bug" | "feature_request" | "support" | "other"; createdBy: string; assignedTo: string | null; createdAt: Date; updatedAt: Date; }[] = []
  let progressUserTickets: { id: number; title: string; description: string; status: "open" | "in_progress" | "waiting_for_response" | "resolved" | "closed"; priority: "low" | "medium" | "high" | "critical"; category: "bug" | "feature_request" | "support" | "other"; createdBy: string; assignedTo: string | null; createdAt: Date; updatedAt: Date; }[] = []
  let closedUserTickets: { id: number; title: string; description: string; status: "open" | "in_progress" | "waiting_for_response" | "resolved" | "closed"; priority: "low" | "medium" | "high" | "critical"; category: "bug" | "feature_request" | "support" | "other"; createdBy: string; assignedTo: string | null; createdAt: Date; updatedAt: Date; }[] = []
  if ((user?.role || 'guest') === 'user' && user?.userId) {
    const userId = user.userId;
    ({ openUserTickets, progressUserTickets, resolvedUserTickets, closedUserTickets } = await getOrSetCache(
      redis,
      dashboardHomeUserCacheKey(userId),
      cacheTtl,
      async () => ({
        openUserTickets: await db.select()
                      .from(ticketsTable)
                      .where(
                        and(
                          eq(ticketsTable.createdBy, userId),
                          (eq(ticketsTable.status, 'open'))
                        )
                      ),
        progressUserTickets: await db.select()
                      .from(ticketsTable)
                      .where(
                        and(
                          eq(ticketsTable.createdBy, userId),
                          (or(eq(ticketsTable.status, 'in_progress'), eq(ticketsTable.status, 'waiting_for_response')))
                        )
                      ),
        resolvedUserTickets: await db.select()
                      .from(ticketsTable)
                      .where(
                        and(
                          eq(ticketsTable.createdBy, userId),
                          eq(ticketsTable.status, 'resolved')
                        )
                      ),
        closedUserTickets: await db.select()
                      .from(ticketsTable)
                      .where(
                        and(
                          eq(ticketsTable.createdBy, userId),
                          eq(ticketsTable.status, 'closed')
                        )
                      ),
      }),
    ));
  }
  let assignedAgentTickets: { id: number; title: string; description: string; status: "open" | "in_progress" | "waiting_for_response" | "resolved" | "closed"; priority: "low" | "medium" | "high" | "critical"; category: "bug" | "feature_request" | "support" | "other"; createdBy: string; assignedTo: string | null; createdAt: Date; updatedAt: Date; }[] = []
  if ((user?.role || 'guest') === 'agent' && user?.userId) {
    const userId = user.userId;
    assignedAgentTickets = await getOrSetCache(
      redis,
      dashboardHomeAgentCacheKey(userId),
      cacheTtl,
      () => db.select()
        .from(ticketsTable)
        .where(
          and(
            eq(ticketsTable.assignedTo, userId),
            not(or(eq(ticketsTable.status, 'resolved'), eq(ticketsTable.status, 'closed'))!)
          )
        ),
    );
  }
  let adminTotal = []
  let adminOpen = []
  let adminUsers = []
  if ((user?.role || 'guest') === 'admin') {
    ({ adminTotal, adminOpen, adminUsers } = await getOrSetCache(
      redis,
      DASHBOARD_HOME_ADMIN_CACHE_KEY,
      cacheTtl,
      async () => ({
        adminTotal: await db.select().from(ticketsTable),
        adminOpen: await db.select()
                             .from(ticketsTable)
                             .where(eq(ticketsTable.status, 'open')),
        adminUsers: await db.select().from(userTable).where(ne(userTable.id, DELETED_USER_ID)),
      }),
    ));
  }
  return new Response(JSON.stringify({
    userRole: user?.role || 'guest',
    userName: user?.name || 'Guest User',
    userId: user?.userId || null,
    openTicketsUser: openUserTickets,
    resolvedTicketsUser: resolvedUserTickets,
    closedTicketsUser: closedUserTickets,
    progressTicketsUser: progressUserTickets,
    assignedAgentTickets,
    adminTotal: adminTotal.length,
    adminOpen: adminOpen.length,
    adminUsers: adminUsers.length,
  }));
}
