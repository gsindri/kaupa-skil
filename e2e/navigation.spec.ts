import { test, expect } from '@playwright/test';

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

// Skip tests when credentials are not provided
// This allows the suite to run in environments without secrets
if (!email || !password) {
  test.skip(true, 'E2E_EMAIL and E2E_PASSWORD must be set to run navigation tests');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  if (page.url().includes('/login')) {
    await page.getByPlaceholder('Email').fill(email!);
    await page.getByPlaceholder('Password').fill(password!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/');
  }
});

test('sidebar links route correctly', async ({ page }) => {
  const links = [
    { label: 'Place Order', path: '/quick-order' },
    { label: 'Basket', path: '/basket' },
    { label: 'Compare', path: '/compare' },
    { label: 'Suppliers', path: '/suppliers' },
  ];

  for (const { label, path } of links) {
    await page.getByRole('link', { name: label }).click();
    await expect(page).toHaveURL(new RegExp(path));
  }
});

test('quick order search flow', async ({ page }) => {
  await page.getByRole('link', { name: 'Place Order' }).click();
  await expect(page).toHaveURL(/quick-order/);

  const searchBox = page.getByPlaceholder('Search items...');
  await searchBox.fill('test');
  await expect(page.getByText(/Searching|No items found/i)).toBeVisible();
});
