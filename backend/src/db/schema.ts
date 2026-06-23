import {
  pgTable,
  pgEnum,
  varchar,
  text,
  timestamp,
  serial,
  integer,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const ticketStatusEnum = pgEnum('ticket_status', [
  'open',
  'in_progress',
  'waiting_for_response',
  'resolved',
  'closed',
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

// Better-auth tables
export const userTable = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  role: text('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessionTable = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
);

export const accountTable = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
);

export const verificationTable = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);

// App tables
export const ticketsTable = pgTable('tickets', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  status: ticketStatusEnum('status').default('open').notNull(),
  priority: ticketPriorityEnum('priority').default('medium').notNull(),
  category: ticketCategoryEnum('category').default('other').notNull(),
  createdBy: text('created_by').references(() => userTable.id).notNull(),
  assignedTo: text('assigned_to').references(() => userTable.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const commentsTable = pgTable('comments', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').references(() => ticketsTable.id).notNull(),
  userId: text('user_id').references(() => userTable.id).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const assignmentsTable = pgTable('assignments', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').references(() => ticketsTable.id).notNull(),
  userId: text('user_id').references(() => userTable.id).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
});

export const auditEventsTable = pgTable('audit_events', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').references(() => ticketsTable.id).notNull(),
  userId: text('user_id').references(() => userTable.id).notNull(),
  action: varchar('action', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const userRelations = relations(userTable, ({ many }) => ({
  createdTickets: many(ticketsTable, { relationName: 'createdBy' }),
  assignedTickets: many(ticketsTable, { relationName: 'assignedTo' }),
  comments: many(commentsTable),
  auditEvents: many(auditEventsTable),
  assignments: many(assignmentsTable),
  sessions: many(sessionTable),
  accounts: many(accountTable),
}));

export const sessionRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, { fields: [sessionTable.userId], references: [userTable.id] }),
}));

export const accountRelations = relations(accountTable, ({ one }) => ({
  user: one(userTable, { fields: [accountTable.userId], references: [userTable.id] }),
}));

export const ticketsRelations = relations(ticketsTable, ({ one, many }) => ({
  creator: one(userTable, {
    fields: [ticketsTable.createdBy],
    references: [userTable.id],
    relationName: 'createdBy',
  }),
  assignee: one(userTable, {
    fields: [ticketsTable.assignedTo],
    references: [userTable.id],
    relationName: 'assignedTo',
  }),
  comments: many(commentsTable),
  auditEvents: many(auditEventsTable),
  assignments: many(assignmentsTable),
}));

export const commentsRelations = relations(commentsTable, ({ one }) => ({
  ticket: one(ticketsTable, { fields: [commentsTable.ticketId], references: [ticketsTable.id] }),
  user: one(userTable, { fields: [commentsTable.userId], references: [userTable.id] }),
}));

export const auditEventsRelations = relations(auditEventsTable, ({ one }) => ({
  ticket: one(ticketsTable, { fields: [auditEventsTable.ticketId], references: [ticketsTable.id] }),
  user: one(userTable, { fields: [auditEventsTable.userId], references: [userTable.id] }),
}));

export const assignmentsRelations = relations(assignmentsTable, ({ one }) => ({
  ticket: one(ticketsTable, { fields: [assignmentsTable.ticketId], references: [ticketsTable.id] }),
  user: one(userTable, { fields: [assignmentsTable.userId], references: [userTable.id] }),
}));

// Keep usersTable as an alias for backwards compat within this file
export const usersTable = userTable;
