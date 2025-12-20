// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  createAdminClient,
  createAnonClient,
  createTestUser,
  deleteTestUser,
  signInAsUser,
} from '../helpers'

describe('Auth Flows', () => {
  const adminClient = createAdminClient()
  let testAdmin: Awaited<ReturnType<typeof createTestUser>>
  let testSales: Awaited<ReturnType<typeof createTestUser>>

  beforeAll(async () => {
    // Create test users with unique IDs
    testAdmin = await createTestUser(adminClient, { role: 'admin', prefix: 'auth' })
    testSales = await createTestUser(adminClient, { role: 'sales', prefix: 'auth' })
  })

  afterAll(async () => {
    // Cleanup test users
    if (testAdmin?.id) await deleteTestUser(adminClient, testAdmin.id)
    if (testSales?.id) await deleteTestUser(adminClient, testSales.id)
  })

  describe('Sign In', () => {
    it('should allow admin to sign in', async () => {
      const client = await signInAsUser(testAdmin.email, testAdmin.password)
      const {
        data: { user },
      } = await client.auth.getUser()

      expect(user).toBeDefined()
      expect(user?.email).toBe(testAdmin.email)
    })

    it('should allow sales to sign in', async () => {
      const client = await signInAsUser(testSales.email, testSales.password)
      const {
        data: { user },
      } = await client.auth.getUser()

      expect(user).toBeDefined()
      expect(user?.email).toBe(testSales.email)
    })

    it('should reject invalid credentials', async () => {
      const client = createAnonClient()
      const { error } = await client.auth.signInWithPassword({
        email: 'nonexistent@crm.local',
        password: 'wrongpassword',
      })

      expect(error).toBeDefined()
      // Supabase returns different error messages depending on configuration
      // Could be "Invalid login credentials" or other auth-related errors
      expect(error?.message).toBeDefined()
    })

    it('should reject wrong password', async () => {
      const client = createAnonClient()
      const { error } = await client.auth.signInWithPassword({
        email: testAdmin.email,
        password: 'wrongpassword',
      })

      expect(error).toBeDefined()
    })
  })

  describe('Profile Access', () => {
    it('should fetch profile with correct role after admin sign in', async () => {
      const client = await signInAsUser(testAdmin.email, testAdmin.password)
      const {
        data: { user },
      } = await client.auth.getUser()

      const { data: profile, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

      expect(error).toBeNull()
      expect(profile).toBeDefined()
      expect(profile?.role).toBe('admin')
    })

    it('should fetch profile with correct role after sales sign in', async () => {
      const client = await signInAsUser(testSales.email, testSales.password)
      const {
        data: { user },
      } = await client.auth.getUser()

      const { data: profile, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

      expect(error).toBeNull()
      expect(profile).toBeDefined()
      expect(profile?.role).toBe('sales')
    })
  })
})
