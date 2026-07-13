import { test, expect, type Browser, type BrowserContext } from '@playwright/test';

// Regression tests for two fixes:
//  1. Ticket close was missing an ownership check (any user could close any ticket).
//  2. CORS reflected the request Origin header, allowing any site to make
//     credentialed cross-origin requests.

const BASE_URL = 'http://localhost:5172';

async function registerAndLogin(browser: Browser, label: string): Promise<BrowserContext> {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const email = `security-e2e-${label}-${Date.now()}@example.com`;
  const password = 'password123';

  const registerRes = await context.request.post('/auth/register', {
    data: { name: `Security E2E ${label}`, email, password },
  });
  expect(registerRes.ok()).toBeTruthy();

  const loginRes = await context.request.post('/auth/login', {
    data: { email, password },
  });
  expect(loginRes.ok()).toBeTruthy();

  return context;
}

test.describe('ticket ownership', () => {
  test('a user cannot close a ticket they do not own', async ({ browser }) => {
    const userA = await registerAndLogin(browser, 'owner');
    const userB = await registerAndLogin(browser, 'attacker');

    const createRes = await userA.request.post('/create_ticket', {
      data: {
        title: 'Owned by user A',
        description: 'Ticket used to verify ownership checks on close.',
        priority: 'low',
        category: 'other',
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const { ticketId } = await createRes.json();

    // User B attempts to close user A's ticket.
    const closeRes = await userB.request.post(`/tickets/${ticketId}`, {
      data: { ticketId, action: 'close' },
    });
    const closeBody = await closeRes.json();
    expect(closeBody.success).toBe(false);

    // Ticket must remain untouched from user A's point of view.
    const getRes = await userA.request.get(`/tickets/${ticketId}`);
    const ticket = await getRes.json();
    expect(ticket.status).not.toBe('closed');

    // The owner closing their own ticket should still work.
    const ownerCloseRes = await userA.request.post(`/tickets/${ticketId}`, {
      data: { ticketId, action: 'close' },
    });
    const ownerCloseBody = await ownerCloseRes.json();
    expect(ownerCloseBody.success).toBe(true);

    await userA.close();
    await userB.close();
  });
});

test.describe('CORS', () => {
  test('does not reflect a disallowed Origin', async ({ request }) => {
    const res = await request.fetch('/tickets', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://evil.example',
        'Access-Control-Request-Method': 'GET',
      },
    });
    expect(res.headers()['access-control-allow-origin']).toBeUndefined();
  });

  test('reflects the configured frontend origin', async ({ request }) => {
    const res = await request.fetch('/tickets', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
    });
    expect(res.headers()['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
