import { createClient, SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

/**
 * Create admin client with service role for test setup/teardown
 * This bypasses RLS - use only for test fixtures
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
        'Create .env.test with local Supabase credentials.'
    )
  }

  return createClient(url, key)
}

/**
 * Create anon client for testing RLS policies
 */
export function createAnonClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_ANON_KEY. ' +
        'Create .env.test with local Supabase credentials.'
    )
  }

  return createClient(url, key)
}

/**
 * Create test user with unique ID (Supabase recommendation)
 * Uses crypto.randomUUID() for test isolation
 */
export async function createTestUser(
  adminClient: SupabaseClient,
  options: {
    role: 'admin' | 'sales' | 'developer'
    prefix?: string
  }
): Promise<{
  id: string
  email: string
  username: string
  password: string
  role: 'admin' | 'sales' | 'developer'
}> {
  const uniqueId = crypto.randomUUID()
  const username = `test_${options.prefix || options.role}_${uniqueId.slice(0, 8)}`
  const email = `${username}@crm.local`
  const password = 'TestPassword123!'

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      display_name: `Test ${options.role}`,
      role: options.role,
    },
  })

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`)
  }

  // Update profile with role (trigger creates profile, we just update role)
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({
      role: options.role,
      display_name: `Test ${options.role}`,
    })
    .eq('id', data.user.id)

  if (profileError) {
    // Clean up auth user if profile update fails
    await adminClient.auth.admin.deleteUser(data.user.id)
    throw new Error(`Failed to update test user profile: ${profileError.message}`)
  }

  // Small delay to avoid rate limiting
  await new Promise((resolve) => setTimeout(resolve, 200))

  return {
    id: data.user.id,
    email,
    username,
    password,
    role: options.role,
  }
}

/**
 * Clean up test user
 */
export async function deleteTestUser(
  adminClient: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) {
    console.warn(`Failed to delete test user ${userId}: ${error.message}`)
  }
}

/**
 * Sign in and return authenticated client
 * Adds retry logic with exponential backoff for rate limiting
 */
export async function signInAsUser(
  email: string,
  password: string,
  retries = 5
): Promise<SupabaseClient> {
  const client = createAnonClient()
  let lastError: Error | null = null

  for (let attempt = 0; attempt < retries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 2s, 4s, 8s, 16s
      const delay = Math.pow(2, attempt) * 1000
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    try {
      const { error } = await client.auth.signInWithPassword({ email, password })

      if (!error) {
        // Small delay after successful sign-in to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200))
        return client
      }

      lastError = new Error(error.message)

      // If not rate limited, don't retry
      if (!error.message.toLowerCase().includes('rate limit') && !error.message.toLowerCase().includes('too many')) {
        throw new Error(`Failed to sign in as ${email}: ${error.message}`)
      }
    } catch (e) {
      // Handle network errors (timeout, etc.)
      lastError = e instanceof Error ? e : new Error(String(e))
      // Continue retrying on network errors
    }
  }

  throw new Error(`Failed to sign in as ${email} after ${retries} attempts: ${lastError?.message}`)
}

/**
 * Generate unique test data prefix
 */
export function generateTestPrefix(): string {
  return crypto.randomUUID().slice(0, 8)
}
