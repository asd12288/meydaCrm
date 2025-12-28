import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

// Load test environment (local Supabase)
dotenv.config({ path: '.env.test' })

// Auth storage directory
const STORAGE_DIR = path.join(__dirname, 'e2e/.auth')

// Check if using external URL (Vercel Preview)
const isExternalUrl = !!(process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL)
const isCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run tests sequentially to avoid conflicts
  forbidOnly: isCI,
  retries: isCI ? 1 : 0, // Reduced from 2 to speed up CI
  workers: 1, // Single worker for sequential execution
  reporter: 'html',
  // Global timeout for each test (1 minute)
  timeout: 60000,

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Action timeout (clicks, fills, etc)
    actionTimeout: 10000,
  },

  projects: [
    // Setup project - runs first to create auth sessions (only 2 logins total)
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // Admin tests - reuse saved admin session (no additional logins)
    {
      name: 'admin-tests',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /auth\.setup\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(STORAGE_DIR, 'admin.json'),
      },
    },
  ],

  // Start server before running tests
  // - External URL (Preview): no server needed
  // - CI: use production build (npm start) - faster and more reliable
  // - Local: use dev server (npm run dev)
  webServer: isExternalUrl ? undefined : {
    command: isCI ? 'npm start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !isCI,
    timeout: 60000, // 1 minute to start server
  },
})
