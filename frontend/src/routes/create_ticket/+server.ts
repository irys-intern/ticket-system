import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '../../db/index.ts';
import { ticketsTable } from '../../db/schema.ts';
import { createTicketSchema } from '../../utils/validators.ts';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request, locals, fetch }) => {
    try {
        const data = await request.json();
        // Validate the input data
        const validatedData = createTicketSchema.parse(data);
        const userIdValue = locals.user?.userId;

        if (userIdValue == null) {
            return json({ success: false, errors: ['User not authenticated'] }, { status: 401 });
        }

        const createdBy = Number(userIdValue);
        if (!Number.isFinite(createdBy)) {
            return json({ success: false, errors: ['Invalid user ID'] }, { status: 400 });
        }

        // Insert the new ticket into the database
        const [newTicket] = await db.insert(ticketsTable).values({
            title: validatedData.title,
            description: validatedData.description,
            createdBy,
            status: 'open', // Default status for new tickets
            priority: validatedData.priority,
            createdAt: new Date(),
            updatedAt: new Date(),
            category: validatedData.category
        }).returning();
        await fetch(`${PUBLIC_BACKEND_URL}/admin/audit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({action: "ticket created", ticketId: newTicket.id})
        })
        return json({ success: true, ticketId: newTicket.id }, { status: 201 });
    } catch (error) {
        console.error('Error creating ticket:', error);
        const message = error instanceof Error ? error.message : String(error);
        return json({ success: false, errors: [message] }, { status: 500 });
    }
}
