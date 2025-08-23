import { test, expect } from '@playwright/test';

// Already authenticated via global-setup storageState.

test('sidebar links route correctly', async ({ page }) => {
  await page.goto('/');

  const links = [
    { label: 'Dashboard', path: '/' },
    { label: 'Catalog', path: '/catalog' },
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

test('catalog search flow', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Catalog' }).click();
  await expect(page).toHaveURL(/catalog/);

  const searchBox = page.getByPlaceholder('Search products');
  await searchBox.fill('test');
  await expect(page.getByTestId('product-card').first()).toBeVisible();
});
