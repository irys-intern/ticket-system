import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '../../db/index.ts';
import { ticketsTable } from '../../db/schema.ts';
import { createTicketSchema } from '../../utils/validators.ts';

export const POST: RequestHandler = async ({ request, locals, fetch }) => {
    try {
        const data = await request.json();
        const validatedData = createTicketSchema.parse(data);
        const createdBy = locals.user?.userId;

        if (!createdBy) {
            return json({ success: false, errors: ['User not authenticated'] }, { status: 401 });
        }

        const [newTicket] = await db.insert(ticketsTable).values({
            title: validatedData.title,
            description: validatedData.description,
            createdBy,
            status: 'open',
            priority: validatedData.priority,
            createdAt: new Date(),
            updatedAt: new Date(),
            category: validatedData.category
        }).returning();
        await fetch('/admin/audit', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({action: "ticket created", ticketId: newTicket.id})
        })
        return json({ success: true, ticketId: newTicket.id }, { status: 201 });
    } catch (error) {
        console.error('Error creating ticket:', error);
        const message = error instanceof Error ? error.message : String(error);
        return json({ success: false, errors: [message] }, { status: 500 });
    }
}
