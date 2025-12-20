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
    const { cleanupAllTestData, createAdminClient } = await import('./helpers')
    const adminClient = createAdminClient()
    await cleanupAllTestData(adminClient)
  }
}
