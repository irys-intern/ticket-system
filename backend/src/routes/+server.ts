import type { RequestEvent } from '@sveltejs/kit';
import { db } from '../db/index.ts';
import { ticketsTable, userTable } from '../db/schema.ts';
import { eq, and, not, or } from 'drizzle-orm';

export async function GET({ locals }: RequestEvent) {
  const user = locals.user;
  let openUserTickets = []
  let resolvedUserTickets = []
  let progressUserTickets = []
  let closedUserTickets = []
  if ((user?.role || 'guest') === 'user' && user?.userId) {
    openUserTickets = await db.select()
                  .from(ticketsTable)
                  .where(
                    and(
                      eq(ticketsTable.createdBy, user.userId),
                      (eq(ticketsTable.status, 'open'))
                    )
                  )
    progressUserTickets = await db.select()
                  .from(ticketsTable)
                  .where(
                    and(
                      eq(ticketsTable.createdBy, user.userId),
                      (or(eq(ticketsTable.status, 'in_progress'), eq(ticketsTable.status, 'waiting_for_response')))
                    )
                  )
    resolvedUserTickets = await db.select()
                  .from(ticketsTable)
                  .where(
                    and(
                      eq(ticketsTable.createdBy, user.userId),
                      eq(ticketsTable.status, 'resolved')
                    )
                  )
    closedUserTickets = await db.select()
                  .from(ticketsTable)
                  .where(
                    and(
                      eq(ticketsTable.createdBy, user.userId),
                      eq(ticketsTable.status, 'closed')
                    )
                  )
  }
  let assignedAgentTickets = []
  if ((user?.role || 'guest') === 'agent' && user?.userId) {
    assignedAgentTickets = await db.select()
    .from(ticketsTable)
    .where(
      and(
        eq(ticketsTable.assignedTo, user.userId),
        not(eq(ticketsTable.status, 'resolved') || eq(ticketsTable.status, 'closed'))
      )
    )
  }
  let adminTotal = []
  if ((user?.role || 'guest') === 'admin') {
    adminTotal = await db.select().from(ticketsTable)
  }
  let adminOpen = []
  if ((user?.role || 'guest') === 'admin') {
    adminOpen = await db.select()
                         .from(ticketsTable)
                         .where(eq(ticketsTable.status, 'open'))
  }
  let adminUsers = []
  if ((user?.role || 'guest') === 'admin') {
    adminUsers = await db.select().from(userTable)
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
