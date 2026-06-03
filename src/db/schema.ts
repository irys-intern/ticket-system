import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
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
  'urgent',
]);
export const ticketCategoryEnum = pgEnum('ticket_category', [
  'bug',
  'feature_request',
  'support',
  'other',
]);

// Tables
export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ticketsTable = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  status: ticketStatusEnum('status').default('open').notNull(),
  priority: ticketPriorityEnum('priority').default('medium').notNull(),
  category: ticketCategoryEnum('category').default('other').notNull(),
  createdBy: uuid('created_by').references(() => usersTable.id).notNull(),
  assignedTo: uuid('assigned_to').references(() => usersTable.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const commentsTable = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').references(() => ticketsTable.id).notNull(),
  userId: uuid('user_id').references(() => usersTable.id).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const assignmentsTable = pgTable('assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').references(() => ticketsTable.id).notNull(),
  userId: uuid('user_id').references(() => usersTable.id).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
});

export const auditEventsTable = pgTable('audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').references(() => ticketsTable.id).notNull(),
  userId: uuid('user_id').references(() => usersTable.id).notNull(),
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
