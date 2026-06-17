import type { RequestEvent } from '@sveltejs/kit';
import { db } from '../db/index.ts';
import { ticketsTable, usersTable } from '../db/schema.ts';
import { eq, and, not } from 'drizzle-orm';

export async function GET({ locals }: RequestEvent) {
  const user = locals.user;
  let openUserTickets: { id: number; title: string; description: string; status: "open" | "in_progress" | "waiting_for_response" | "resolved" | "closed"; priority: "low" | "medium" | "high" | "critical"; category: "bug" | "feature_request" | "support" | "other"; createdBy: number; assignedTo: number | null; createdAt: Date; updatedAt: Date; }[] = []
  if ((user?.role || 'guest') === 'user' && user?.userId) {
    openUserTickets = await db.select()
                  .from(ticketsTable)
                  .where(
                    and(
                      eq(ticketsTable.createdBy, parseInt(user.userId)),
                      (eq(ticketsTable.status, 'open'))
                    )
                  )
  }
  let resolvedUserTickets: { id: number; title: string; description: string; status: "open" | "in_progress" | "waiting_for_response" | "resolved" | "closed"; priority: "low" | "medium" | "high" | "critical"; category: "bug" | "feature_request" | "support" | "other"; createdBy: number; assignedTo: number | null; createdAt: Date; updatedAt: Date; }[] = []
  if ((user?.role || 'guest') === 'user' && user?.userId) {
    resolvedUserTickets = await db.select()
                  .from(ticketsTable)
                  .where(
                    and(
                      eq(ticketsTable.createdBy, parseInt(user.userId)),
                      eq(ticketsTable.status, 'resolved')
                    )
                  )
  }
  let assignedAgentTickets: { id: number; title: string; description: string; status: "open" | "in_progress" | "waiting_for_response" | "resolved" | "closed"; priority: "low" | "medium" | "high" | "critical"; category: "bug" | "feature_request" | "support" | "other"; createdBy: number; assignedTo: number | null; createdAt: Date; updatedAt: Date; }[] = []
  if ((user?.role || 'guest') === 'agent' && user?.userId) {
    assignedAgentTickets = await db.select()
    .from(ticketsTable)
    .where(
      and(
        eq(ticketsTable.assignedTo, parseInt(user.userId)),
        not(eq(ticketsTable.status, 'resolved')||eq(ticketsTable.status, 'closed'))
      )
    )
  }
  let adminTotal: { id: number; title: string; description: string; status: "open" | "in_progress" | "resolved" | "closed" | "waiting_for_response"; priority: "low" | "medium" | "high" | "critical"; category: "bug" | "feature_request" | "support" | "other"; createdBy: number; assignedTo: number | null; createdAt: Date; updatedAt: Date; }[] = []
  if ((user?.role || 'guest') === 'admin') {
    adminTotal = await db.select()
    .from(ticketsTable)
  }
  let adminOpen: { id: number; title: string; description: string; status: "open" | "in_progress" | "resolved" | "closed" | "waiting_for_response"; priority: "low" | "medium" | "high" | "critical"; category: "bug" | "feature_request" | "support" | "other"; createdBy: number; assignedTo: number | null; createdAt: Date; updatedAt: Date; }[] = []
  if ((user?.role || 'guest') === 'admin') {
    adminOpen = await db.select()
                         .from(ticketsTable)
                         .where(eq(ticketsTable.status, 'open'))
  }
  let adminUsers = []
  if ((user?.role || 'guest') === 'admin') {
    adminUsers = await db.select()
                         .from(usersTable)
  }
  return new Response(JSON.stringify({
    userRole: user?.role || 'guest',
    userName: user?.name || 'Guest User',
    userId: user?.userId || null,
    openTicketsUser: openUserTickets,
    resolvedTicketsUser: resolvedUserTickets,
    assignedAgentTickets,
    adminTotal: adminTotal.length,
    adminOpen: adminOpen.length,
    adminUsers: adminUsers.length,
  }));
}

