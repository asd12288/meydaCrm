import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

// Load test environment (local Supabase)
dotenv.config({ path: '.env.test' })

// Auth storage directory
const STORAGE_DIR = path.join(__dirname, 'e2e/.auth')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run tests sequentially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for sequential execution
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
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

  // Start dev server before running tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
