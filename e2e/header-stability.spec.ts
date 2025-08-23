import { test, expect } from '@playwright/test';

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

if (!email || !password) {
  test.skip(true, 'E2E_EMAIL and E2E_PASSWORD must be set to run header stability tests');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
  if (await dashboardLink.count().then(c => c > 0)) {
    await expect(dashboardLink).toBeVisible();
    return;
  }
  await page.goto('/auth/signin');
  await page.getByPlaceholder(/email/i).fill(email!);
  await page.getByPlaceholder(/password/i).fill(password!);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
});

test('header remains fixed when overlay opens and closes', async ({ page }) => {
  const header = page.getByRole('banner');
  const before = await header.boundingBox();
  await page.getByRole('button', { name: 'Help' }).click();
  const afterOpen = await header.boundingBox();
  await page.keyboard.press('Escape');
  const afterClose = await header.boundingBox();
  expect(afterOpen?.x).toBe(before?.x);
  expect(afterOpen?.width).toBe(before?.width);
  expect(afterClose?.x).toBe(before?.x);
  expect(afterClose?.width).toBe(before?.width);
});

test('header position is stable when search is focused', async ({ page }) => {
  const header = page.getByRole('banner');
  const search = page.getByPlaceholder('Search products, suppliers, orders...');
  const before = await header.boundingBox();
  await search.focus();
  const afterFocus = await header.boundingBox();
  await search.evaluate((el: HTMLInputElement) => el.blur());
  const afterBlur = await header.boundingBox();
  expect(afterFocus?.x).toBe(before?.x);
  expect(afterFocus?.width).toBe(before?.width);
  expect(afterBlur?.x).toBe(before?.x);
  expect(afterBlur?.width).toBe(before?.width);
});

test('right action buttons keep width and styles on focus', async ({ page }) => {
  const buttons = page.locator('header nav button');
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i);
    const before = await btn.evaluate(el => {
      const s = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        className: el.className,
        paddingLeft: s.paddingLeft,
        paddingRight: s.paddingRight,
        borderLeft: s.borderLeftWidth,
        borderRight: s.borderRightWidth,
        width: rect.width,
      };
    });
    await btn.focus();
    const after = await btn.evaluate(el => {
      const s = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        className: el.className,
        paddingLeft: s.paddingLeft,
        paddingRight: s.paddingRight,
        borderLeft: s.borderLeftWidth,
        borderRight: s.borderRightWidth,
        width: rect.width,
      };
    });
    expect(after).toEqual(before);
  }
});
