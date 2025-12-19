import { beforeAll, afterAll } from 'vitest'
import { config } from 'dotenv'

// Load test environment variables
config({ path: '.env.test' })

beforeAll(() => {
  // Verify required env vars for local Supabase
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.warn(
      `\n⚠️  Missing test environment variables: ${missing.join(', ')}\n` +
        `   Create a .env.test file with local Supabase credentials.\n` +
        `   Run 'supabase start' to get the keys.\n`
    )
  }
})

afterAll(() => {
  // Global cleanup if needed
})
