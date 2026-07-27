import type { RequestEvent } from '@sveltejs/kit';
import { db } from '../db/index.ts';
import { ticketsTable, userTable } from '../db/schema.ts';
import { eq, and, not, or } from 'drizzle-orm';
import { redis } from '../lib/redis.ts';
import { getOrSetCache } from '../lib/cache.ts';
import {
  DASHBOARD_CACHE_TTL_SECONDS,
  DASHBOARD_HOME_ADMIN_CACHE_KEY,
  dashboardHomeAgentCacheKey,
  dashboardHomeUserCacheKey,
} from '../lib/dashboardCache.ts';

export async function GET({ locals }: RequestEvent) {
  const user = locals.user;
  let openUserTickets: { id: number; title: string; description: string; status: "open" | "in_progress" | "waiting_for_response" | "resolved" | "closed"; priority: "low" | "medium" | "high" | "critical"; category: "bug" | "feature_request" | "support" | "other"; createdBy: string; assignedTo: string | null; createdAt: Date; updatedAt: Date; }[] = []
  let resolvedUserTickets: { id: number; title: string; description: string; status: "open" | "in_progress" | "waiting_for_response" | "resolved" | "closed"; priority: "low" | "medium" | "high" | "critical"; category: "bug" | "feature_request" | "support" | "other"; createdBy: string; assignedTo: string | null; createdAt: Date; updatedAt: Date; }[] = []
  let progressUserTickets: { id: number; title: string; description: string; status: "open" | "in_progress" | "waiting_for_response" | "resolved" | "closed"; priority: "low" | "medium" | "high" | "critical"; category: "bug" | "feature_request" | "support" | "other"; createdBy: string; assignedTo: string | null; createdAt: Date; updatedAt: Date; }[] = []
  let closedUserTickets: { id: number; title: string; description: string; status: "open" | "in_progress" | "waiting_for_response" | "resolved" | "closed"; priority: "low" | "medium" | "high" | "critical"; category: "bug" | "feature_request" | "support" | "other"; createdBy: string; assignedTo: string | null; createdAt: Date; updatedAt: Date; }[] = []
  if ((user?.role || 'guest') === 'user' && user?.userId) {
    const userId = user.userId;
    ({ openUserTickets, progressUserTickets, resolvedUserTickets, closedUserTickets } = await getOrSetCache(
      redis,
      dashboardHomeUserCacheKey(userId),
      DASHBOARD_CACHE_TTL_SECONDS,
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
      DASHBOARD_CACHE_TTL_SECONDS,
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
      DASHBOARD_CACHE_TTL_SECONDS,
      async () => ({
        adminTotal: await db.select().from(ticketsTable),
        adminOpen: await db.select()
                             .from(ticketsTable)
                             .where(eq(ticketsTable.status, 'open')),
        adminUsers: await db.select().from(userTable),
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
