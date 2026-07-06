import 'dotenv/config';
import { inArray } from 'drizzle-orm';
import { db } from './index.ts';
import { userTable, ticketsTable, commentsTable, auditEventsTable } from './schema.ts';

type Status = 'open' | 'in_progress' | 'waiting_for_response' | 'resolved' | 'closed';
type Priority = 'low' | 'medium' | 'high' | 'critical';
type Category = 'bug' | 'feature_request' | 'support' | 'other';

// Deterministic PRNG so re-running against a fresh DB produces the same demo data.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260706);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const chance = (p: number) => rand() < p;
const DAY_MS = 86_400_000;

const CUSTOMERS = [
  { id: 'demo-user-1', name: 'Alice Nguyen', email: 'alice@demo.example.com', role: 'user' },
  { id: 'demo-user-2', name: 'Marcus Webb', email: 'marcus@demo.example.com', role: 'user' },
  { id: 'demo-user-3', name: 'Priya Patel', email: 'priya@demo.example.com', role: 'user' },
  { id: 'demo-user-4', name: 'Diego Alvarez', email: 'diego@demo.example.com', role: 'user' },
  { id: 'demo-user-5', name: 'Hana Kobayashi', email: 'hana@demo.example.com', role: 'user' },
  { id: 'demo-user-6', name: 'Owen Fitzgerald', email: 'owen@demo.example.com', role: 'user' },
  { id: 'demo-user-7', name: 'Zara Ahmed', email: 'zara@demo.example.com', role: 'user' },
  { id: 'demo-user-8', name: 'Lucas Meier', email: 'lucas@demo.example.com', role: 'user' },
] as const;

// speed multiplier applied to resolution time — lower resolves faster
const AGENTS = [
  { id: 'demo-agent-1', name: 'Bob Chen', email: 'bob@demo.example.com', role: 'agent', speed: 0.7 },
  { id: 'demo-agent-2', name: 'Renee Dubois', email: 'renee@demo.example.com', role: 'agent', speed: 1.4 },
  { id: 'demo-agent-3', name: 'Tomas Novak', email: 'tomas@demo.example.com', role: 'agent', speed: 1.0 },
  { id: 'demo-agent-4', name: 'Aisha Yusuf', email: 'aisha@demo.example.com', role: 'agent', speed: 0.5 },
  { id: 'demo-agent-5', name: 'Grace Lindqvist', email: 'grace@demo.example.com', role: 'agent', speed: 1.8 },
] as const;

const ADMINS = [
  { id: 'demo-admin-1', name: 'Carol Reyes', email: 'carol@demo.example.com', role: 'admin' },
] as const;

const USERS = [...CUSTOMERS, ...AGENTS.map(({ speed, ...a }) => a), ...ADMINS];

const TEMPLATES: { title: string; description: string; category: Category }[] = [
  { title: 'Login page crashes on mobile Safari', description: 'Users on iOS report a blank screen after entering credentials. Reproduces consistently on Safari.', category: 'bug' },
  { title: 'API returns 500 on empty search query', description: 'Submitting the search form with an empty string triggers an unhandled exception in the backend.', category: 'bug' },
  { title: 'Ticket list pagination broken past page 3', description: 'Navigating past page 2 on the ticket list returns the same results as page 2. Off-by-one in the offset calculation.', category: 'bug' },
  { title: 'Attachment upload silently fails over 5MB', description: 'Uploading attachments larger than 5MB fails with no error shown and the file is not saved.', category: 'bug' },
  { title: 'Duplicate email notifications sent', description: 'Users report receiving the same status-change email two or three times in a row.', category: 'bug' },
  { title: 'Dark mode toggle resets on refresh', description: 'The dark mode preference is not persisted between page loads.', category: 'bug' },
  { title: 'Comment timestamps show wrong timezone', description: 'Comment times appear to be in UTC instead of the user\'s local timezone.', category: 'bug' },
  { title: 'CSV export missing category column', description: 'The exported CSV omits the ticket category field even though it is selected in the filter panel.', category: 'bug' },
  { title: 'Session expires while filling out a ticket', description: 'Long-form ticket submissions are lost when the session times out mid-edit.', category: 'bug' },
  { title: 'Priority badge color incorrect for critical', description: 'Critical priority tickets render with the same badge color as high priority.', category: 'bug' },
  { title: 'Add dark mode toggle', description: 'Many users have requested a dark mode option that respects OS preference by default.', category: 'feature_request' },
  { title: 'Export tickets to CSV', description: 'Admins need to export the full ticket list to CSV for monthly reporting.', category: 'feature_request' },
  { title: 'Improve ticket search performance', description: 'Full-text search on large ticket sets takes several seconds; an index would help.', category: 'feature_request' },
  { title: 'Email notifications for ticket updates', description: 'Users want an email when their ticket status changes or a comment is added.', category: 'feature_request' },
  { title: 'Bulk assign tickets to an agent', description: 'Admins would like to select multiple tickets and assign them to one agent in a single action.', category: 'feature_request' },
  { title: 'Saved filter presets', description: 'Agents want to save frequently used filter combinations on the ticket list.', category: 'feature_request' },
  { title: 'Keyboard shortcuts for common actions', description: 'Power users have requested shortcuts for claiming, closing, and commenting on tickets.', category: 'feature_request' },
  { title: 'Customer satisfaction rating on close', description: 'Ask users to rate their support experience when a ticket is closed.', category: 'feature_request' },
  { title: 'Password reset email not arriving', description: 'Several users report the password reset email never arrives, even after checking spam.', category: 'support' },
  { title: 'How do I change my account email?', description: 'A user is asking how to update the email address associated with their account.', category: 'support' },
  { title: 'Cannot find previous tickets after login', description: 'A returning user cannot locate tickets they submitted a few weeks ago.', category: 'support' },
  { title: 'Billing invoice shows wrong plan tier', description: 'The monthly invoice lists the legacy plan name instead of the current plan.', category: 'support' },
  { title: 'Requesting data export for compliance', description: 'A customer is requesting a full export of their account data for an internal audit.', category: 'support' },
  { title: 'Two-factor authentication not sending codes', description: 'A user set up 2FA but is not receiving SMS codes on login attempts.', category: 'support' },
  { title: 'Update FAQ page with new billing info', description: 'The FAQ page still references the old pricing tiers and needs to reflect the new plans.', category: 'other' },
  { title: 'Agent dashboard shows incorrect open count', description: 'The count badge on the agent dashboard reads 0 even when open tickets exist.', category: 'other' },
  { title: 'Account deletion leaves orphaned tickets', description: 'When a user account is deleted, their tickets remain with a null createdBy reference.', category: 'other' },
  { title: 'Onboarding checklist is out of date', description: 'The new-user onboarding checklist references a settings page that was removed.', category: 'other' },
];

const PRIORITIES: { value: Priority; weight: number }[] = [
  { value: 'low', weight: 35 },
  { value: 'medium', weight: 35 },
  { value: 'high', weight: 20 },
  { value: 'critical', weight: 10 },
];

function weightedPick<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rand() * total;
  for (const item of items) {
    if ((r -= item.weight) <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

// Older tickets are more likely to have reached a terminal state.
function pickStatus(ageDays: number): Status {
  if (ageDays > 45) return weightedPick([
    { value: 'resolved' as Status, weight: 25 },
    { value: 'closed' as Status, weight: 60 },
    { value: 'open' as Status, weight: 5 },
    { value: 'in_progress' as Status, weight: 10 },
  ]);
  if (ageDays > 10) return weightedPick([
    { value: 'resolved' as Status, weight: 25 },
    { value: 'closed' as Status, weight: 30 },
    { value: 'in_progress' as Status, weight: 20 },
    { value: 'waiting_for_response' as Status, weight: 15 },
    { value: 'open' as Status, weight: 10 },
  ]);
  return weightedPick([
    { value: 'open' as Status, weight: 40 },
    { value: 'in_progress' as Status, weight: 35 },
    { value: 'waiting_for_response' as Status, weight: 15 },
    { value: 'resolved' as Status, weight: 10 },
  ]);
}

// Higher-priority tickets tend to get resolved faster, scaled by each agent's speed.
function resolutionDays(priority: Priority, speed: number): number {
  const base = { critical: 0.5, high: 1.5, medium: 4, low: 8 }[priority];
  return base * speed * (0.5 + rand());
}

const RANGE_DAYS = 240; // ~8 months of history
const NUM_TICKETS = 380;
const now = new Date();

type GeneratedTicket = {
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  createdBy: string;
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
  workingAgentId: string | null; // agent who actually worked it, even if later unassigned
};

function generateTickets(): GeneratedTicket[] {
  const tickets: GeneratedTicket[] = [];
  for (let i = 0; i < NUM_TICKETS; i++) {
    const template = pick(TEMPLATES);
    const ageDays = rand() * RANGE_DAYS;
    const createdAt = new Date(now.getTime() - ageDays * DAY_MS);
    const status = pickStatus(ageDays);
    const priority = weightedPick(PRIORITIES);
    const createdBy = chance(0.08) ? pick(ADMINS).id : pick(CUSTOMERS).id;

    let assignedTo: string | null = null;
    let workingAgentId: string | null = null;
    let updatedAt = createdAt;

    if (status !== 'open') {
      const agent = pick(AGENTS);
      workingAgentId = agent.id;
      assignedTo = agent.id;

      if (status === 'resolved' || status === 'closed') {
        const days = Math.min(resolutionDays(priority, agent.speed), ageDays);
        updatedAt = new Date(createdAt.getTime() + days * DAY_MS);
        // Some closures happen via the user/admin flow, which unassigns the agent.
        if (status === 'closed' && chance(0.4)) assignedTo = null;
      }
    }

    tickets.push({
      title: template.title,
      description: template.description,
      category: template.category,
      priority,
      status,
      createdBy,
      assignedTo,
      createdAt,
      updatedAt,
      workingAgentId,
    });
  }
  return tickets.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

async function seed() {
  console.log('Seeding users...');
  await db.insert(userTable).values(USERS).onConflictDoNothing();
  console.log(`  ${USERS.length} users upserted`);

  const seedUserIds = USERS.map((u) => u.id);
  const existing = await db.select({ id: ticketsTable.id }).from(ticketsTable)
    .where(inArray(ticketsTable.createdBy, seedUserIds)).limit(1);
  if (existing.length > 0) {
    console.log('Seed tickets already present — skipping generation to avoid duplicates. Manually created tickets are unaffected.');
    process.exit(0);
  }

  console.log(`Generating ${NUM_TICKETS} tickets over ${RANGE_DAYS} days...`);
  const generated = generateTickets();

  const insertedTickets = await db.insert(ticketsTable).values(
    generated.map(({ workingAgentId, ...t }) => t),
  ).returning({ id: ticketsTable.id });
  console.log(`  ${insertedTickets.length} tickets inserted`);

  const auditRows: (typeof auditEventsTable.$inferInsert)[] = [];
  const commentRows: (typeof commentsTable.$inferInsert)[] = [];

  const COMMENT_POOL = [
    'Thanks for reporting this — looking into it now.',
    'Can you share the steps you took right before this happened?',
    'I was able to reproduce this on my end.',
    'Pushed a fix, should be resolved shortly.',
    'This should now be fixed — please let us know if it happens again.',
    'Following up on this, any updates on your side?',
    'Still seeing this on the latest version.',
    'Thanks, that resolved it for me.',
    'Escalating this given the impact reported.',
    'Closing this out as resolved. Feel free to reopen if it recurs.',
  ];

  generated.forEach((t, i) => {
    const ticketId = insertedTickets[i].id;

    auditRows.push({ ticketId, userId: t.createdBy, action: 'ticket created', createdAt: t.createdAt });

    if (t.workingAgentId) {
      const assignedAt = new Date(t.createdAt.getTime() + rand() * 4 * 3_600_000);
      auditRows.push({ ticketId, userId: t.workingAgentId, action: 'ticket assigned', createdAt: assignedAt });
      auditRows.push({ ticketId, userId: t.workingAgentId, action: 'status changed', createdAt: assignedAt });

      if (t.status === 'resolved' || t.status === 'closed') {
        auditRows.push({ ticketId, userId: t.workingAgentId, action: 'status changed', createdAt: t.updatedAt });
      }

      if (chance(0.55)) {
        const commentCount = 1 + Math.floor(rand() * 4);
        const span = Math.max(t.updatedAt.getTime() - assignedAt.getTime(), 3_600_000);
        for (let c = 0; c < commentCount; c++) {
          const author = chance(0.5) ? t.createdBy : t.workingAgentId;
          commentRows.push({
            ticketId,
            userId: author,
            content: pick(COMMENT_POOL),
            createdAt: new Date(assignedAt.getTime() + (span * (c + 1)) / (commentCount + 1)),
          });
        }
      }
    }
  });

  console.log(`Inserting ${auditRows.length} audit events...`);
  for (let i = 0; i < auditRows.length; i += 500) {
    await db.insert(auditEventsTable).values(auditRows.slice(i, i + 500));
  }

  console.log(`Inserting ${commentRows.length} comments...`);
  for (let i = 0; i < commentRows.length; i += 500) {
    await db.insert(commentsTable).values(commentRows.slice(i, i + 500));
  }

  console.log('Done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
