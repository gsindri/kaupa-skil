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

  // If already authenticated, bail early
  const dashboardLink = page.getByRole('link', { name: /dashboard/i })
  if (await dashboardLink.count().then(c => c > 0)) {
    await expect(dashboardLink).toBeVisible()
    return
  }

  // Try canonical sign-in, then fallback to /login if needed
  await page.goto('/auth/signin')
  const hasForm =
    (await page.locator('form').count()) > 0 ||
    (await page.locator('input[type="email"], input[name*=mail i], [placeholder*=mail i]').count()) > 0
  if (!hasForm) {
    await page.goto('/login')
  }

  // Ultra-flexible selectors (labels, placeholders, or type attributes)
  const emailInput = page
    .locator('input[type="email"], input[name="email"], input[name*=mail i], [placeholder*=mail i]')
    .first()
  const passwordInput = page
    .locator('input[type="password"], input[name="password"], [placeholder*=password i]')
    .first()

  await emailInput.waitFor({ timeout: 10_000 })
  await passwordInput.waitFor({ timeout: 10_000 })

  await emailInput.fill(email!)
  await passwordInput.fill(password!)

  // Flexible submit button text
  const submitBtn = page.getByRole('button', { name: /sign in|log in|continue|submit/i }).first()
  if (await submitBtn.count()) {
    await submitBtn.click()
  } else {
    await page.locator('button, [type=submit]').first().click()
  }

  // Confirm app shell is up
  await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible({ timeout: 15_000 })
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
