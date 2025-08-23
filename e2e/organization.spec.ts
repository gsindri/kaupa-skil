import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

const password = process.env.E2E_SIGNUP_PASSWORD;

if (!password) {
  test.skip(true, 'E2E_SIGNUP_PASSWORD must be set to run sign-up flow tests');
}

// ⬇️ Ensure this spec runs logged OUT (overrides global storageState)
test.use({ storageState: { cookies: [], origins: [] } });

test('sign-up, solo data access, organization creation and switch', async ({ page }) => {
  const email = `test+${randomUUID()}@example.com`;

  await page.goto('/auth/signup');

  // Fill sign-up form (use robust role-based selectors if placeholders change)
  await page.getByPlaceholder('Full name').fill('Test User');
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password').fill(password!);
  await page.getByRole('button', { name: /sign up/i }).click();

  // Onboarding flow
  await expect(page.getByText(/Tell us about your organization/i)).toBeVisible();
  await expect(page.getByText(/Personal workspace/i)).toBeVisible();

  const orgName = `Org ${Math.random().toString(36).slice(2, 8)}`;
  await page.getByLabel('Organization Name').fill(orgName);
  await page.getByLabel('Primary Contact Name').fill('Jane Doe');
  await page.getByLabel('Phone Number').fill('+3545551234');
  await page.getByLabel('Business Address').fill('Laugavegur 1, Reykjavik');
  await page.getByRole('button', { name: /continue/i }).click();

  // Category/sector selection (adjust text if your copy differs)
  await page.getByText('Véfkaupmenn').click();
  await page.getByRole('button', { name: /^continue$/i }).click();

  await page.getByRole('button', { name: /complete setup/i }).click();

  // Landed and showing the new org
  await expect(page.getByText(orgName)).toBeVisible();
});
