import { Router } from 'express';
import * as ticketsController from '../controllers/ticketsController';
import { requireAuth, requireRole } from '../middleware/authorization';
import { UserRole } from '../types/index';

const ticketsRouter = Router();

// All routes require authentication
ticketsRouter.use(requireAuth);

// List and create tickets
ticketsRouter.get('/', ticketsController.listTickets);
ticketsRouter.post('/', ticketsController.createTicket);

// Get, update, and manage specific ticket
ticketsRouter.get('/:id', ticketsController.getTicket);
ticketsRouter.patch('/:id', ticketsController.updateTicket);

// Assign ticket (agent/admin only)
ticketsRouter.post('/:id/assign', requireRole(UserRole.AGENT, UserRole.ADMIN), ticketsController.assignTicket);

// Update ticket status
ticketsRouter.patch('/:id/status', ticketsController.updateTicketStatus);

// Comments (TODO: implement in controller)
// ticketsRouter.get('/:id/comments', ticketsController.getComments);
// ticketsRouter.post('/:id/comments', ticketsController.addComment);

export default ticketsRouter;
