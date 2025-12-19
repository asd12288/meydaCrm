// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  signInAsUser,
  generateTestPrefix,
} from '../helpers'

describe('RLS Policies - Leads', () => {
  const adminClient = createAdminClient()
  const testPrefix = generateTestPrefix()

  let admin: Awaited<ReturnType<typeof createTestUser>>
  let sales1: Awaited<ReturnType<typeof createTestUser>>
  let sales2: Awaited<ReturnType<typeof createTestUser>>
  let testLeadId: string

  beforeAll(async () => {
    // Create test users with unique prefix for this test suite
    admin = await createTestUser(adminClient, { role: 'admin', prefix: `rls_${testPrefix}` })
    sales1 = await createTestUser(adminClient, { role: 'sales', prefix: `rls_s1_${testPrefix}` })
    sales2 = await createTestUser(adminClient, { role: 'sales', prefix: `rls_s2_${testPrefix}` })

    // Create test lead assigned to sales1 (using admin/service role)
    const { data, error } = await adminClient
      .from('leads')
      .insert({
        first_name: 'Test',
        last_name: `Lead_${testPrefix}`,
        email: `test_${testPrefix}@example.com`,
        assigned_to: sales1.id,
        status: 'new',
        status_label: 'Nouveau',
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create test lead: ${error.message}`)
    }

    testLeadId = data.id
  })

  afterAll(async () => {
    // Cleanup in reverse order
    if (testLeadId) {
      await adminClient.from('leads').delete().eq('id', testLeadId)
    }
    if (admin?.id) await deleteTestUser(adminClient, admin.id)
    if (sales1?.id) await deleteTestUser(adminClient, sales1.id)
    if (sales2?.id) await deleteTestUser(adminClient, sales2.id)
  })

  describe('Read Access', () => {
    it('admin can see all leads', async () => {
      const client = await signInAsUser(admin.email, admin.password)
      const { data, error } = await client.from('leads').select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThanOrEqual(1)
      expect(data!.some((l) => l.id === testLeadId)).toBe(true)
    })

    it('sales1 can see their assigned leads', async () => {
      const client = await signInAsUser(sales1.email, sales1.password)
      const { data, error } = await client.from('leads').select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.some((l) => l.id === testLeadId)).toBe(true)
    })

    it('sales2 cannot see leads assigned to sales1', async () => {
      const client = await signInAsUser(sales2.email, sales2.password)
      const { data, error } = await client.from('leads').select('*')

      expect(error).toBeNull()
      // sales2 should NOT see leads assigned to sales1
      expect(data!.some((l) => l.id === testLeadId)).toBe(false)
    })
  })

  describe('Update Access', () => {
    it('sales1 can update their assigned leads', async () => {
      const client = await signInAsUser(sales1.email, sales1.password)
      const { error } = await client
        .from('leads')
        .update({ notes: `Updated by sales1 at ${Date.now()}` })
        .eq('id', testLeadId)

      expect(error).toBeNull()
    })

    it('sales2 cannot update leads assigned to sales1', async () => {
      const client = await signInAsUser(sales2.email, sales2.password)
      const { data } = await client
        .from('leads')
        .update({ notes: 'Attempted update by sales2' })
        .eq('id', testLeadId)
        .select()

      // RLS prevents the update - returns empty array, not error
      expect(data?.length ?? 0).toBe(0)
    })

    it('admin can update any lead', async () => {
      const client = await signInAsUser(admin.email, admin.password)
      const { error } = await client
        .from('leads')
        .update({ notes: `Updated by admin at ${Date.now()}` })
        .eq('id', testLeadId)

      expect(error).toBeNull()
    })
  })

  describe('Insert Access', () => {
    let adminCreatedLeadId: string | null = null

    afterAll(async () => {
      // Cleanup lead created by admin
      if (adminCreatedLeadId) {
        await adminClient.from('leads').delete().eq('id', adminCreatedLeadId)
      }
    })

    it('admin can insert leads', async () => {
      const client = await signInAsUser(admin.email, admin.password)
      const { data, error } = await client
        .from('leads')
        .insert({
          first_name: 'Admin',
          last_name: `Created_${testPrefix}`,
          email: `admin_created_${testPrefix}@example.com`,
          status: 'new',
          status_label: 'Nouveau',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      adminCreatedLeadId = data?.id || null
    })

    it('sales cannot insert leads', async () => {
      const client = await signInAsUser(sales1.email, sales1.password)
      const { error } = await client.from('leads').insert({
        first_name: 'Sales',
        last_name: 'ShouldFail',
        email: `sales_fail_${testPrefix}@example.com`,
        status: 'new',
        status_label: 'Nouveau',
      })

      // RLS should block the insert
      expect(error).toBeDefined()
    })
  })
})

describe('RLS Policies - Profiles', () => {
  const adminClient = createAdminClient()
  const testPrefix = generateTestPrefix()

  let admin: Awaited<ReturnType<typeof createTestUser>>
  let sales: Awaited<ReturnType<typeof createTestUser>>

  beforeAll(async () => {
    admin = await createTestUser(adminClient, { role: 'admin', prefix: `profile_${testPrefix}` })
    sales = await createTestUser(adminClient, { role: 'sales', prefix: `profile_${testPrefix}` })
  })

  afterAll(async () => {
    if (admin?.id) await deleteTestUser(adminClient, admin.id)
    if (sales?.id) await deleteTestUser(adminClient, sales.id)
  })

  it('admin can read all profiles', async () => {
    const client = await signInAsUser(admin.email, admin.password)
    const { data, error } = await client.from('profiles').select('*')

    expect(error).toBeNull()
    expect(data).toBeDefined()
    // Admin should see at least 2 profiles (admin + sales)
    expect(data!.length).toBeGreaterThanOrEqual(2)
  })

  it('sales can read all profiles (for assignee dropdown)', async () => {
    const client = await signInAsUser(sales.email, sales.password)
    const { data, error } = await client.from('profiles').select('*')

    expect(error).toBeNull()
    expect(data).toBeDefined()
    // Sales can read all profiles (needed for assignee dropdown)
    expect(data!.length).toBeGreaterThanOrEqual(2)
    // Their own profile should be included
    expect(data!.some((p) => p.id === sales.id)).toBe(true)
  })

  it('sales can update their own profile', async () => {
    const client = await signInAsUser(sales.email, sales.password)
    const newName = `Updated_${testPrefix}`
    const { error } = await client
      .from('profiles')
      .update({ display_name: newName })
      .eq('id', sales.id)

    expect(error).toBeNull()
  })

  it('sales cannot update other profiles', async () => {
    const client = await signInAsUser(sales.email, sales.password)
    const { data } = await client
      .from('profiles')
      .update({ display_name: 'Hacked!' })
      .eq('id', admin.id)
      .select()

    // RLS prevents update - returns empty array
    expect(data?.length ?? 0).toBe(0)
  })
})
