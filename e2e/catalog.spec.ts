import { test, expect } from '@playwright/test'

const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

if (!email || !password) {
  test.skip(true, 'E2E_EMAIL and E2E_PASSWORD must be set to run catalog tests')
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  const dashboardLink = page.getByRole('link', { name: /dashboard/i })
  if (await dashboardLink.count().then(c => c > 0)) {
    await expect(dashboardLink).toBeVisible()
    return
  }
  await page.goto('/auth/signin')
  const hasForm =
    (await page.locator('form').count()) > 0 ||
    (await page.locator('input[type="email"], input[name*=mail i], [placeholder*=mail i]').count()) > 0
  if (!hasForm) {
    await page.goto('/login')
  }
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
  const submitBtn = page.getByRole('button', { name: /sign in|log in|continue|submit/i }).first()
  if (await submitBtn.count()) {
    await submitBtn.click()
  } else {
    await page.locator('button, [type=submit]').first().click()
  }
  await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible({ timeout: 15_000 })
})

test('catalog shows supplier badges', async ({ page }) => {
  await page.getByRole('link', { name: 'Place Order' }).click()
  await expect(page).toHaveURL(/quick-order/)
  const badge = page.locator('[data-testid="supplier-badge"]').first()
  await expect(badge).toBeVisible()
})
