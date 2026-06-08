import { z } from 'zod';
import { TicketStatus, TicketPriority, TicketCategory } from '../types/index.ts';

// Auth schemas
export const registerSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Ticket schemas
export const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum([TicketPriority.LOW, TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.CRITICAL]),
  category: z.enum([
    TicketCategory.BUG,
    TicketCategory.FEATURE_REQUEST,
    TicketCategory.SUPPORT,
    TicketCategory.OTHER,
  ]),
});

export const updateTicketSchema = createTicketSchema.partial().extend({
  status: z.enum([
    TicketStatus.OPEN,
    TicketStatus.IN_PROGRESS,
    TicketStatus.RESOLVED,
    TicketStatus.CLOSED,
    TicketStatus.REOPENED,
  ]).optional(),
});

export const assignTicketSchema = z.object({
  userId: z.uuid('Invalid user ID'),
});

// Comment schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(5000),
});

// Types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
