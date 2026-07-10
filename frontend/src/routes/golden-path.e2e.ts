import { test, expect } from '@playwright/test';

test('a new user can register, log in, and create a ticket', async ({ page }) => {
  const unique = Date.now();
  const email = `e2e-${unique}@example.com`;
  const password = 'password123';
  const name = 'E2E Test User';

  await page.goto('/auth/register');
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm Password').fill(password);
  await page.getByRole('button', { name: /create account|register/i }).click();

  await page.waitForURL('**/auth/login');

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /log in/i }).click();

  await page.waitForURL('**/');

  await page.goto('/create_ticket');
  const title = `E2E ticket ${unique}`;
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Description').fill('This ticket was created by an automated end-to-end test.');
  await page.getByRole('button', { name: /submit ticket/i }).click();

  await page.waitForURL('**/tickets/**');
  await expect(page.getByText(title)).toBeVisible();
});
