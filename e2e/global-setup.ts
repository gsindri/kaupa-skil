// e2e/global-setup.ts
import { chromium, expect } from '@playwright/test';

export default async function globalSetup() {
  const baseURL = process.env.PW_BASE_URL || 'http://localhost:4173';
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error('E2E_EMAIL and E2E_PASSWORD must be set for global login.');
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Go straight to sign-in
  await page.goto(`${baseURL}/auth/signin`, { waitUntil: 'networkidle' });

  // Use role-based selectors (more robust than placeholders)
  await page.getByRole('textbox', { name: /email/i }).fill(email);
  await page.getByRole('textbox', { name: /password/i }).fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // Verify that the top navigation header has loaded. Using the ARIA
  // landmark role is more robust than a brittle data-selector and avoids
  // timeouts when the attribute is absent.
  await expect(page.getByRole('banner')).toBeVisible({ timeout: 20_000 });

  // Persist authenticated storage for the test run
  await context.storageState({ path: 'playwright/.auth/state.json' });
  await browser.close();
}
