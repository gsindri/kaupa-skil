import { test, expect } from '@playwright/test'

const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

if (!email || !password) {
  test.skip(true, 'E2E_EMAIL and E2E_PASSWORD must be set to run catalog tests')
}

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', email!)
  await page.fill('input[type="password"]', password!)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard')
})

test('catalog search shows products and prices', async ({ page }) => {
  await page.goto('/catalog')
  await page.getByPlaceholder('Search products').fill('milk')
  const cards = page.locator('[data-testid="product-card"]')
  await expect(cards.first()).toBeVisible()
  const priceBadge = page.locator('[data-testid="price-badge"]').first()
  if (await priceBadge.count()) {
    await expect(priceBadge).toHaveText(/ISK/)
  }
})
