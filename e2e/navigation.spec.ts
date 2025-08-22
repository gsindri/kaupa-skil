import { test, expect } from '@playwright/test';

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

// Skip tests when credentials are not provided
// This allows the suite to run in environments without secrets
if (!email || !password) {
  test.skip(true, 'E2E_EMAIL and E2E_PASSWORD must be set to run navigation tests');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')

  // If already authenticated, the sidebar link should exist
  const dashboardLink = page.getByRole('link', { name: 'Dashboard' })
  if (await dashboardLink.count().then(c => c > 0)) {
    await expect(dashboardLink).toBeVisible()
    return
  }

  // Not logged in → go to the canonical sign-in route
  await page.goto('/auth/signin')

  // Fill credentials and submit (support both "sign in" / "log in" labels)
  await page.getByPlaceholder(/email/i).fill(email!)
  await page.getByPlaceholder(/password/i).fill(password!)
  await page.getByRole('button', { name: /sign in|log in/i }).click()

  // Wait for the app shell to appear (more reliable than URL only)
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
})


test('sidebar links route correctly', async ({ page }) => {
  const links = [
    { label: 'Dashboard', path: '/' },
    { label: 'Place Order', path: '/quick-order' },
    { label: 'Compare', path: '/compare' },
    { label: 'Suppliers', path: '/suppliers' },
  ];

  for (const { label, path } of links) {
    await page.getByRole('link', { name: label }).click();
    if (path === '/') {
      await expect(page).toHaveURL(/\/$/);
    } else {
      await expect(page).toHaveURL(new RegExp(path));
    }
  }
});

test('quick order search flow', async ({ page }) => {
  await page.getByRole('link', { name: 'Place Order' }).click();
  await expect(page).toHaveURL(/quick-order/);

  const searchBox = page.getByPlaceholder('Search items...');
  await searchBox.fill('test');
  await expect(page.getByText(/Searching|No items found/i)).toBeVisible();
});
