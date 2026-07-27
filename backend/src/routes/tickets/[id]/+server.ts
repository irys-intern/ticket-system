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

    if (user.role !== 'agent' && user.role !== 'admin' && ticket.createdBy !== user.userId) {
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
    if (!params.id) {
        return json({success:false})
    }
    if (data.ticketId !== parseInt(params.id)) {
        throw error(403, `Mangled request: ${data.ticketId} vs ${params.id}`)
    }
    if (user.role === 'agent') {
        if (data.agent !== user.userId) {
            throw error(401, "Bad auth")
        }
        if (data.action === 'claim') {
            const current_assignment = await db.select().from(ticketsTable).where(eq(ticketsTable.id, parseInt(params.id)))
            if (current_assignment.length > 0 && current_assignment[0].assignedTo) {
                return json({success:false, body: current_assignment})
            }
            const ret = await db.update(ticketsTable)
                                .set({assignedTo: user.userId, status: 'in_progress'})
                                .where(eq(ticketsTable.id, parseInt(params.id)))
                                .returning()
            await fetch('/admin/audit', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({action: "ticket assigned", ticketId: params.id})
            })
            await fetch('/admin/audit', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({action: "status changed", ticketId: params.id})
            })
            await fetch(`/tickets/${params.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId: params.id, content: `Ticket claimed`, automated: true })
            })
            return json({success: true, ticket: ret})
        } else if (data.action === 'forfeit') {
            const current_assignment = await db.select().from(ticketsTable).where(and(eq(ticketsTable.id, parseInt(params.id)), eq(ticketsTable.assignedTo, user.userId)))
            if (current_assignment.length === 0 || current_assignment[0].status === 'closed') {
                return json({success:false})
            }
            await db.update(ticketsTable).set({assignedTo: null, status: 'open'}).where(eq(ticketsTable.id, parseInt(params.id)))
            await fetch('/admin/audit', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({action: "ticket reassigned", ticketId: params.id})
            })
            await fetch('/admin/audit', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({action: "status changed", ticketId: params.id})
            })
            await fetch(`/tickets/${params.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId: params.id, content: `Ticket forfeited`, automated: true })
            })
            return json({success: true})
        } else if (data.action === 'close') {
            const ticketToClose = await db.select().from(ticketsTable).where(eq(ticketsTable.id, parseInt(params.id))).limit(1)
            if (ticketToClose.length === 0 || ticketToClose[0].status === 'closed') return json({ok: false, success: false})
            await fetch('/admin/audit', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({action: "status changed", ticketId: params.id})
            })
            // Comment is sent from frontend. assignedTo is intentionally preserved so resolution time is trackable.
            await db.update(ticketsTable).set({status: 'closed'}).where(eq(ticketsTable.id, parseInt(params.id)))
            return json({ok: true, success: true})
        } else if (data.action === 'update_status') {
            const statussy = ["open", "in_progress", "waiting_for_response", "resolved"]
            if (statussy.indexOf(data.status) === -1) return json({ok:false, success:false})
            const ticketToUpdate = await db.select().from(ticketsTable).where(eq(ticketsTable.id, parseInt(params.id))).limit(1)
            if (ticketToUpdate.length === 0 || ticketToUpdate[0].status === 'closed') return json({ok: false, success: false})
            await fetch('/admin/audit', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({action: "status changed", ticketId: params.id})
            });
            await db.update(ticketsTable).set({status: data.status}).where(eq(ticketsTable.id, parseInt(params.id)));
            if (data.status==='resolved') {
                await db.update(ticketsTable).set({updatedAt: new Date()}).where(eq(ticketsTable.id, parseInt(params.id)));
            }
            await fetch(`/tickets/${params.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId: params.id, content: `Ticket status updated to ${data.status}`, automated: true })
            })
            return json({ok: true, success: true})
        } else if (data.action === 'update_metadata') {
            const ticket = await db.select().from(ticketsTable).where(eq(ticketsTable.id, parseInt(params.id))).limit(1);
            if (ticket.length === 0) throw error(404, 'Ticket not found');
            if (ticket[0].assignedTo !== user.userId) throw error(403, 'Forbidden');
            if (ticket[0].status === 'closed' || ticket[0].status === 'resolved') throw error(409, 'Ticket is closed or resolved');

            const validPriorities = ['low', 'medium', 'high', 'critical'];
            const validCategories = ['bug', 'feature_request', 'support', 'other'];
            if (data.priority !== undefined && !validPriorities.includes(data.priority)) return json({ok: false, success: false});
            if (data.category !== undefined && !validCategories.includes(data.category)) return json({ok: false, success: false});
            if (data.priority === undefined && data.category === undefined) return json({ok: false, success: false});

            await db.update(ticketsTable).set({
                ...(data.priority !== undefined ? { priority: data.priority } : {}),
                ...(data.category !== undefined ? { category: data.category } : {}),
            }).where(eq(ticketsTable.id, parseInt(params.id)));
            await fetch('/admin/audit', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({action: "ticket updated", ticketId: params.id})
            });
            const message = data.priority !== undefined ? "priority updated" : "category updated"
            await fetch(`/tickets/${params.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId: params.id, content: `Ticket ${message}`, automated: true })
            })
            return json({ok: true, success: true})
        }

        return json({success: false, body: 'Invalid action'})
    } else if (user.role === 'admin') {
        if (data.action === 'assign') {
            const ret = await db.update(ticketsTable)
            .set({assignedTo: data.agent, status: 'in_progress'})
            .where(eq(ticketsTable.id, parseInt(params.id)))
            .returning()
            await fetch('/admin/audit', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({action: "ticket assigned", ticketId: params.id})
            })
            await fetch('/admin/audit', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({action: "status changed", ticketId: params.id})
            })
            await fetch(`/tickets/${params.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId: params.id, content: `An agent has been assigned to this ticket.`, automated: true })
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
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({action: "ticket reassigned", ticketId: params.id})
            })
            await fetch(`/tickets/${params.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId: params.id, content: `This ticket's agent has been unassigned`, automated: true })
            })
            return json({success: true})
        } else if (data.action === 'close') {
            const ticketToClose = await db.select().from(ticketsTable).where(eq(ticketsTable.id, parseInt(params.id))).limit(1)
            if (ticketToClose.length === 0 || ticketToClose[0].status === 'closed') return json({ok: false, success: false})
            await fetch('/admin/audit', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({action: "status changed", ticketId: params.id})
            })
            await db.update(ticketsTable).set({status: 'closed'}).where(eq(ticketsTable.id, parseInt(params.id)))
            await fetch(`/tickets/${params.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId: params.id, content: `Ticket closed`, automated: true })
            })
            return json({ok: true, success: true})
        } else if (data.action === 'update_metadata') {
            const ticket = await db.select().from(ticketsTable).where(eq(ticketsTable.id, parseInt(params.id))).limit(1);
            if (ticket.length === 0) throw error(404, 'Ticket not found');
            if (ticket[0].status === 'closed' || ticket[0].status === 'resolved') throw error(409, 'Ticket is closed or resolved');
            
            const validPriorities = ['low', 'medium', 'high', 'critical'];
            const validCategories = ['bug', 'feature_request', 'support', 'other'];
            if (data.priority !== undefined && !validPriorities.includes(data.priority)) return json({ok: false, success: false});
            if (data.category !== undefined && !validCategories.includes(data.category)) return json({ok: false, success: false});
            if (data.priority === undefined && data.category === undefined) return json({ok: false, success: false});
            
            await db.update(ticketsTable).set({
                ...(data.priority !== undefined ? { priority: data.priority } : {}),
                ...(data.category !== undefined ? { category: data.category } : {}),
            }).where(eq(ticketsTable.id, parseInt(params.id)));
            await fetch('/admin/audit', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({action: "ticket updated", ticketId: params.id})
            });
            const message = data.priority !== undefined ? "priority updated" : "category updated"
            await fetch(`/tickets/${params.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId: params.id, content: `Ticket ${message}`, automated: true })
            })
            return json({ok: true, success: true})
        }

        return json({success: false, body: 'Invalid action'})
    } else if (user.role === 'user') {
        if (data.action === 'close') {
            const ticketToClose = await db.select().from(ticketsTable)
                .where(and(eq(ticketsTable.id, parseInt(params.id)), eq(ticketsTable.createdBy, user.userId)))
                .limit(1)
            if (ticketToClose.length === 0 || ticketToClose[0].status === 'closed') return json({ok: false, success: false})
            await fetch('/admin/audit', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({action: "status changed", ticketId: params.id})
            })
            await db.update(ticketsTable)
                .set({status: 'closed'})
                .where(and(eq(ticketsTable.id, parseInt(params.id)), eq(ticketsTable.createdBy, user.userId)))
            return json({ok: true, success: true})
        } else {
            return json({ok:false, success:false})
        }
    } else {
        return json({success: false, body: `user.role is set to ${user.role}`})
    }
}
