import { error, json, type RequestHandler } from '@sveltejs/kit'
import { db } from '../../../db/index.ts'
import { ticketsTable } from '../../../db/schema.ts'
import { eq } from 'drizzle-orm'

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