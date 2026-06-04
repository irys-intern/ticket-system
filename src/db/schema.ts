import {
  pgTable,
  pgEnum,
  varchar,
  text,
  timestamp,
  jsonb,
  serial,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'agent', 'admin']);
export const ticketStatusEnum = pgEnum('ticket_status', [
  'open',
  'in_progress',
  'resolved',
  'closed',
  'reopened',
]);
export const ticketPriorityEnum = pgEnum('ticket_priority', [
  'low',
  'medium',
  'high',
  'critical',
]);
export const ticketCategoryEnum = pgEnum('ticket_category', [
  'bug',
  'feature_request',
  'support',
  'other',
]);

// Tables
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 100 }).unique().notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: text('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ticketsTable = pgTable('tickets', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  status: ticketStatusEnum('status').default('open').notNull(),
  priority: ticketPriorityEnum('priority').default('medium').notNull(),
  category: ticketCategoryEnum('category').default('other').notNull(),
  createdBy: integer('created_by').references(() => usersTable.id).notNull(),
  assignedTo: integer('assigned_to').references(() => usersTable.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const commentsTable = pgTable('comments', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').references(() => ticketsTable.id).notNull(),
  userId: integer('user_id').references(() => usersTable.id).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const assignmentsTable = pgTable('assignments', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').references(() => ticketsTable.id).notNull(),
  userId: integer('user_id').references(() => usersTable.id).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
});

export const auditEventsTable = pgTable('audit_events', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').references(() => ticketsTable.id).notNull(),
  userId: integer('user_id').references(() => usersTable.id).notNull(),
  action: varchar('action', { length: 255 }).notNull(),
  changes: jsonb('changes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  createdTickets: many(ticketsTable, {
    relationName: 'createdBy',
  }),
  assignedTickets: many(ticketsTable, {
    relationName: 'assignedTo',
  }),
  comments: many(commentsTable),
  auditEvents: many(auditEventsTable),
  assignments: many(assignmentsTable),
}));

export const ticketsRelations = relations(ticketsTable, ({ one, many }) => ({
  creator: one(usersTable, {
    fields: [ticketsTable.createdBy],
    references: [usersTable.id],
    relationName: 'createdBy',
  }),
  assignee: one(usersTable, {
    fields: [ticketsTable.assignedTo],
    references: [usersTable.id],
    relationName: 'assignedTo',
  }),
  comments: many(commentsTable),
  auditEvents: many(auditEventsTable),
  assignments: many(assignmentsTable),
}));

export const commentsRelations = relations(commentsTable, ({ one }) => ({
  ticket: one(ticketsTable, {
    fields: [commentsTable.ticketId],
    references: [ticketsTable.id],
  }),
  user: one(usersTable, {
    fields: [commentsTable.userId],
    references: [usersTable.id],
  }),
}));

export const auditEventsRelations = relations(auditEventsTable, ({ one }) => ({
  ticket: one(ticketsTable, {
    fields: [auditEventsTable.ticketId],
    references: [ticketsTable.id],
  }),
  user: one(usersTable, {
    fields: [auditEventsTable.userId],
    references: [usersTable.id],
  }),
}));

export const assignmentsRelations = relations(assignmentsTable, ({ one }) => ({
  ticket: one(ticketsTable, {
    fields: [assignmentsTable.ticketId],
    references: [ticketsTable.id],
  }),
  user: one(usersTable, {
    fields: [assignmentsTable.userId],
    references: [usersTable.id],
  }),
}));
