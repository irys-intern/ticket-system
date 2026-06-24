import 'dotenv/config';
import { db } from './index.ts';
import { userTable, ticketsTable } from './schema.ts';

const USERS = [
  { id: 'seed-user-1', name: 'Alice User', email: 'alice@example.com', role: 'user' },
  { id: 'seed-agent-1', name: 'Bob Agent', email: 'bob@example.com', role: 'agent' },
  { id: 'seed-admin-1', name: 'Carol Admin', email: 'carol@example.com', role: 'admin' },
];

function d(dateStr: string) {
  return new Date(dateStr);
}

const TICKETS = [
  {
    title: 'Login page crashes on mobile Safari',
    description: 'Users on iOS 17 report a blank screen after entering credentials. Reproduces consistently on iPhone 14 with Safari 17.',
    status: 'open' as const,
    priority: 'critical' as const,
    category: 'bug' as const,
    createdBy: 'seed-user-1',
    createdAt: d('2026-06-22T09:14:00Z'),
    updatedAt: d('2026-06-22T09:14:00Z'),
  },
  {
    title: 'API returns 500 on empty search query',
    description: 'Submitting the search form with an empty string triggers an unhandled exception in the backend. Expected: return empty results.',
    status: 'in_progress' as const,
    priority: 'high' as const,
    category: 'bug' as const,
    createdBy: 'seed-user-1',
    assignedTo: 'seed-agent-1',
    createdAt: d('2026-06-18T14:02:00Z'),
    updatedAt: d('2026-06-19T10:30:00Z'),
  },
  {
    title: 'Password reset email not arriving',
    description: 'Several users report that the password reset email never arrives. Spam folders checked. Affects accounts created after June 1.',
    status: 'waiting_for_response' as const,
    priority: 'high' as const,
    category: 'support' as const,
    createdBy: 'seed-user-1',
    assignedTo: 'seed-agent-1',
    createdAt: d('2026-06-20T08:45:00Z'),
    updatedAt: d('2026-06-21T16:00:00Z'),
  },
  {
    title: 'Add dark mode toggle',
    description: 'Many users have requested a dark mode option. Should respect the OS preference by default and allow manual override via a toggle in the user settings.',
    status: 'open' as const,
    priority: 'medium' as const,
    category: 'feature_request' as const,
    createdBy: 'seed-user-1',
    createdAt: d('2026-06-10T11:20:00Z'),
    updatedAt: d('2026-06-10T11:20:00Z'),
  },
  {
    title: 'Export tickets to CSV',
    description: 'Admins need to export the full ticket list to CSV for monthly reporting. Should include all fields and respect current filters.',
    status: 'open' as const,
    priority: 'medium' as const,
    category: 'feature_request' as const,
    createdBy: 'seed-admin-1',
    createdAt: d('2026-06-15T13:55:00Z'),
    updatedAt: d('2026-06-15T13:55:00Z'),
  },
  {
    title: 'Ticket list pagination broken at page 3+',
    description: 'Navigating past page 2 on the ticket list returns the same results as page 2. Off-by-one in the offset calculation.',
    status: 'in_progress' as const,
    priority: 'medium' as const,
    category: 'bug' as const,
    createdBy: 'seed-agent-1',
    assignedTo: 'seed-agent-1',
    createdAt: d('2026-06-17T09:05:00Z'),
    updatedAt: d('2026-06-18T15:20:00Z'),
  },
  {
    title: 'Update FAQ page with new billing info',
    description: 'The FAQ page still references the old pricing tiers. Needs to be updated to reflect the new plans announced in Q2.',
    status: 'resolved' as const,
    priority: 'low' as const,
    category: 'other' as const,
    createdBy: 'seed-admin-1',
    assignedTo: 'seed-agent-1',
    createdAt: d('2026-06-03T10:00:00Z'),
    updatedAt: d('2026-06-05T14:30:00Z'),
  },
  {
    title: 'Improve ticket search performance',
    description: 'Full-text search on large ticket sets takes 3–5 seconds. A database index on title and description should bring this under 200ms.',
    status: 'open' as const,
    priority: 'medium' as const,
    category: 'feature_request' as const,
    createdBy: 'seed-agent-1',
    createdAt: d('2026-06-12T16:40:00Z'),
    updatedAt: d('2026-06-12T16:40:00Z'),
  },
  {
    title: 'Attachment upload fails for files over 5MB',
    description: 'Uploading attachments larger than 5MB silently fails — no error is shown and the file is not saved. The limit should be 20MB per the spec.',
    status: 'open' as const,
    priority: 'high' as const,
    category: 'bug' as const,
    createdBy: 'seed-user-1',
    createdAt: d('2026-06-21T07:30:00Z'),
    updatedAt: d('2026-06-21T07:30:00Z'),
  },
  {
    title: 'Email notifications for ticket updates',
    description: 'Users want to receive an email when their ticket status changes or a comment is added. Should be opt-in per ticket.',
    status: 'closed' as const,
    priority: 'low' as const,
    category: 'feature_request' as const,
    createdBy: 'seed-user-1',
    assignedTo: 'seed-agent-1',
    createdAt: d('2026-05-20T12:00:00Z'),
    updatedAt: d('2026-06-01T09:15:00Z'),
  },
  {
    title: 'Agent dashboard shows incorrect open ticket count',
    description: 'The count badge on the agent dashboard reads 0 even when open tickets exist. Likely a caching issue introduced in the last deploy.',
    status: 'resolved' as const,
    priority: 'medium' as const,
    category: 'bug' as const,
    createdBy: 'seed-agent-1',
    assignedTo: 'seed-agent-1',
    createdAt: d('2026-06-08T14:10:00Z'),
    updatedAt: d('2026-06-09T11:00:00Z'),
  },
  {
    title: 'Account deletion removes all associated data',
    description: 'When a user account is deleted, their tickets remain orphaned in the database with a null createdBy. Either cascade delete or reassign to a ghost user.',
    status: 'waiting_for_response' as const,
    priority: 'critical' as const,
    category: 'bug' as const,
    createdBy: 'seed-admin-1',
    assignedTo: 'seed-agent-1',
    createdAt: d('2026-06-19T17:25:00Z'),
    updatedAt: d('2026-06-23T08:50:00Z'),
  },
];

async function seed() {
  console.log('Seeding users...');
  await db.insert(userTable).values(USERS).onConflictDoNothing();
  console.log(`  ${USERS.length} users upserted`);

  console.log('Seeding tickets...');
  const inserted = await db.insert(ticketsTable).values(TICKETS).onConflictDoNothing().returning({ id: ticketsTable.id });
  console.log(`  ${inserted.length} tickets inserted`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
