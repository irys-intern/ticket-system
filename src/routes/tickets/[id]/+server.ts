import { error, json, type RequestHandler } from '@sveltejs/kit'
import { db } from '../../../db/index.ts'
import { ticketsTable } from '../../../db/schema.ts'
import { and, eq } from 'drizzle-orm'
export const GET: RequestHandler = async ({ params, locals }) => {
    const id = Number(params.id)
    if (Number.isNaN(id)) {
        throw error(400, 'Invalid ticket id')
    }

    const tickets = await db.select()
        .from(ticketsTable)
        .where(eq(ticketsTable.id, id))
        .limit(1)
    const ticket = tickets[0]
    if (!ticket) {
        throw error(404, 'Ticket not found')
    }

    const user = locals.user
    if (!user) {
        throw error(401, 'Unauthorized')
    }

    if (user.role !== 'agent' && user.role !== 'admin' && ticket.createdBy.toString() !== user.userId) {
        throw error(403, 'Forbidden')
    }

    return json(ticket)
}

export const POST: RequestHandler = async ({ params, request, locals, fetch }) => {
    const user = locals.user;
    const data = await request.json();
    if (!user || !user.userId) {
        throw error(401, "Unauthenticated")
    }
    if (data.ticketId !== parseInt(params.id)) {
        throw error(403, `Mangled request: ${data.ticketId} vs ${params.id}`)
    }
    if (user.role === 'agent') {
        if (parseInt(data.agent) !== parseInt(user.userId)) {
            throw error(401, "Bad auth")
        }
        if (data.action === 'claim') {
            const current_assignment = await db.select().from(ticketsTable).where(eq(ticketsTable.id, parseInt(params.id)))
            if (current_assignment.length > 0 && current_assignment[0].assignedTo) {
                return json({success:false, body: current_assignment})
            }
            const ret = await db.update(ticketsTable)
                                .set({assignedTo: parseInt(user.userId), status: 'in_progress'})
                                .where(eq(ticketsTable.id, parseInt(params.id)))
                                .returning()
            await fetch('/admin/audit', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({action: "ticket assigned", ticketId: params.id})
            })
            await fetch('/admin/audit', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({action: "status changed", ticketId: params.id})
            })
            return json({success: true, ticket: ret})
        } else if (data.action === 'forfeit') {
            const current_assignment = await db.select().from(ticketsTable).where(and(eq(ticketsTable.id, parseInt(params.id)), eq(ticketsTable.assignedTo, parseInt(user.userId))))
            if (current_assignment.length === 0) {
                return json({success:false})
            }
            await db.update(ticketsTable).set({assignedTo: null, status: 'open'}).where(eq(ticketsTable.id, parseInt(params.id)))
            await fetch('/admin/audit', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({action: "ticket reassigned", ticketId: params.id})
            })
            return json({success: true})
        }

        return json({success: false, body: 'Invalid action'})
    } else if (user.role === 'admin') {
        if (data.action === 'assign') {
            const ret = await db.update(ticketsTable)
                                .set({assignedTo: parseInt(data.agent), status: 'in_progress'})
                                .where(eq(ticketsTable.id, parseInt(params.id)))
                                .returning()
            await fetch('/admin/audit', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({action: "ticket assigned", ticketId: params.id})
            })
            await fetch('/admin/audit', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({action: "status changed", ticketId: params.id})
            })
            return json({success: true, ticket: ret})
        } else if (data.action === 'unassign') {
            const current_assignment = await db.select().from(ticketsTable).where(eq(ticketsTable.id, parseInt(params.id)))
            if (current_assignment.length === 0 || !current_assignment[0].assignedTo) {
                return json({success:false, body:current_assignment})
            }
            await db.update(ticketsTable).set({assignedTo: null, status: 'open'}).where(eq(ticketsTable.id, parseInt(params.id)))
            await fetch('/admin/audit', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({action: "ticket reassigned", ticketId: params.id})
            })
            return json({success: true})
        }

        return json({success: false, body: 'Invalid action'})
    } else {
        return json({success: false, body: `user.role is set to ${user.role}`})
    }
}