import { test, expect } from '@playwright/test';

// Already authenticated via global-setup storageState.

test('sidebar links route correctly', async ({ page }) => {
  await page.goto('/');

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
  await page.goto('/');

  await page.getByRole('link', { name: 'Place Order' }).click();
  await expect(page).toHaveURL(/quick-order/);

  const searchBox = page.getByPlaceholder('Search items...');
  await searchBox.fill('test');
  await expect(page.getByText(/Searching|No items found/i)).toBeVisible();
});
