import { config } from 'dotenv'

// Load test environment variables
config({ path: '.env.test' })

/**
 * Global setup that returns a teardown function
 * Vitest runs setup before tests, teardown after all tests complete
 */
export default async function globalSetup() {
  // Return teardown function that cleans up test data
  return async () => {
    // Skip cleanup if Supabase credentials aren't available (unit tests only)
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      console.log('Skipping test cleanup: no Supabase credentials')
      return
    }

    const { cleanupAllTestData, createAdminClient } = await import('./helpers')
    const adminClient = createAdminClient()
    await cleanupAllTestData(adminClient)
  }
}
