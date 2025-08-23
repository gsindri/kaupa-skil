import { defineConfig, devices } from '@playwright/test';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,

  // ✅ run the one-time login before tests
  globalSetup: './e2e/global-setup.ts',

  use: {
    headless: true,
    // ✅ agree on the base URL (CI will set PW_BASE_URL=http://localhost:4173)
    baseURL: process.env.PW_BASE_URL || 'http://localhost:4173',
    // ✅ reuse the authenticated storage from global-setup
    storageState: 'playwright/.auth/state.json',
    trace: 'on-first-retry',
  },

  webServer: {
    // Build the app, then serve a production-like preview
    command: 'pnpm build && pnpm preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
