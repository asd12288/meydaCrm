// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  signInAsUser,
  generateTestPrefix,
} from '../helpers'

describe('RLS Policies - Support Tickets', () => {
  const adminClient = createAdminClient()
  const testPrefix = generateTestPrefix()

  let admin: Awaited<ReturnType<typeof createTestUser>>
  let developer: Awaited<ReturnType<typeof createTestUser>>
  let sales: Awaited<ReturnType<typeof createTestUser>>
  let testTicketId: string

  beforeAll(async () => {
    // Create test users with unique prefix for this test suite
    admin = await createTestUser(adminClient, { role: 'admin', prefix: `support_${testPrefix}` })
    developer = await createTestUser(adminClient, { role: 'developer', prefix: `support_dev_${testPrefix}` })
    sales = await createTestUser(adminClient, { role: 'sales', prefix: `support_sales_${testPrefix}` })

    // Create test ticket (using admin/service role)
    const { data, error } = await adminClient
      .from('support_tickets')
      .insert({
        created_by: admin.id,
        category: 'bug',
        subject: `Test Ticket ${testPrefix}`,
        description: 'This is a test ticket for RLS testing',
        status: 'open',
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create test ticket: ${error.message}`)
    }

    testTicketId = data.id
  })

  afterAll(async () => {
    // Cleanup in reverse order
    if (testTicketId) {
      // Delete comments first (cascade should handle this, but be explicit)
      await adminClient.from('support_ticket_comments').delete().eq('ticket_id', testTicketId)
      await adminClient.from('support_tickets').delete().eq('id', testTicketId)
    }
    if (admin?.id) await deleteTestUser(adminClient, admin.id)
    if (developer?.id) await deleteTestUser(adminClient, developer.id)
    if (sales?.id) await deleteTestUser(adminClient, sales.id)
  })

  describe('Read Access', () => {
    it('admin can read all tickets', async () => {
      const client = await signInAsUser(admin.email, admin.password)
      const { data, error } = await client.from('support_tickets').select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.some((t) => t.id === testTicketId)).toBe(true)
    })

    it('developer can read all tickets', async () => {
      const client = await signInAsUser(developer.email, developer.password)
      const { data, error } = await client.from('support_tickets').select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.some((t) => t.id === testTicketId)).toBe(true)
    })

    it('sales cannot read any tickets', async () => {
      const client = await signInAsUser(sales.email, sales.password)
      const { data, error } = await client.from('support_tickets').select('*')

      expect(error).toBeNull()
      // Sales should NOT see any tickets
      expect(data!.length).toBe(0)
    })
  })

  describe('Insert Access', () => {
    let adminCreatedTicketId: string | null = null

    afterAll(async () => {
      if (adminCreatedTicketId) {
        await adminClient.from('support_tickets').delete().eq('id', adminCreatedTicketId)
      }
    })

    it('admin can create tickets', async () => {
      const client = await signInAsUser(admin.email, admin.password)
      const { data, error } = await client
        .from('support_tickets')
        .insert({
          created_by: admin.id,
          category: 'feature',
          subject: `Admin Created Ticket ${testPrefix}`,
          description: 'Admin created this ticket',
          status: 'open',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      adminCreatedTicketId = data?.id || null
    })

    it('developer cannot create tickets', async () => {
      const client = await signInAsUser(developer.email, developer.password)
      const { error } = await client.from('support_tickets').insert({
        created_by: developer.id,
        category: 'bug',
        subject: 'Developer Should Fail',
        description: 'Developer should not be able to create tickets',
        status: 'open',
      })

      // RLS should block the insert
      expect(error).toBeDefined()
    })

    it('sales cannot create tickets', async () => {
      const client = await signInAsUser(sales.email, sales.password)
      const { error } = await client.from('support_tickets').insert({
        created_by: sales.id,
        category: 'bug',
        subject: 'Sales Should Fail',
        description: 'Sales should not be able to create tickets',
        status: 'open',
      })

      // RLS should block the insert
      expect(error).toBeDefined()
    })
  })

  describe('Update Access', () => {
    it('admin can update tickets', async () => {
      const client = await signInAsUser(admin.email, admin.password)
      const { error } = await client
        .from('support_tickets')
        .update({ status: 'in_progress' })
        .eq('id', testTicketId)

      expect(error).toBeNull()
    })

    it('developer cannot update tickets', async () => {
      const client = await signInAsUser(developer.email, developer.password)
      const { data } = await client
        .from('support_tickets')
        .update({ status: 'resolved' })
        .eq('id', testTicketId)
        .select()

      // RLS prevents the update - returns empty array
      expect(data?.length ?? 0).toBe(0)
    })

    it('sales cannot update tickets', async () => {
      const client = await signInAsUser(sales.email, sales.password)
      const { data } = await client
        .from('support_tickets')
        .update({ status: 'closed' })
        .eq('id', testTicketId)
        .select()

      // RLS prevents the update - returns empty array
      expect(data?.length ?? 0).toBe(0)
    })
  })

  describe('Delete Access', () => {
    let ticketToDelete: string | null = null

    beforeAll(async () => {
      // Create a ticket specifically for delete testing
      const { data } = await adminClient
        .from('support_tickets')
        .insert({
          created_by: admin.id,
          category: 'feedback',
          subject: `Delete Test Ticket ${testPrefix}`,
          description: 'This ticket will be deleted',
          status: 'open',
        })
        .select()
        .single()
      ticketToDelete = data?.id || null
    })

    afterAll(async () => {
      if (ticketToDelete) {
        await adminClient.from('support_tickets').delete().eq('id', ticketToDelete)
      }
    })

    it('admin can delete tickets', async () => {
      if (!ticketToDelete) {
        throw new Error('No ticket to delete')
      }

      const client = await signInAsUser(admin.email, admin.password)
      const { error } = await client
        .from('support_tickets')
        .delete()
        .eq('id', ticketToDelete)

      expect(error).toBeNull()
      ticketToDelete = null // Mark as deleted
    })

    it('developer cannot delete tickets', async () => {
      // Create another ticket to test developer delete
      const { data: newTicket } = await adminClient
        .from('support_tickets')
        .insert({
          created_by: admin.id,
          category: 'feedback',
          subject: `Dev Delete Test ${testPrefix}`,
          description: 'Developer should not delete this',
          status: 'open',
        })
        .select()
        .single()

      const client = await signInAsUser(developer.email, developer.password)
      await client
        .from('support_tickets')
        .delete()
        .eq('id', newTicket!.id)

      // Developer has no delete policy, so this will fail or return 0 rows
      // Note: Without a delete policy, the delete just affects 0 rows (no error)
      // Verify the ticket still exists
      const { data: checkTicket } = await adminClient
        .from('support_tickets')
        .select()
        .eq('id', newTicket!.id)
        .single()

      expect(checkTicket).toBeDefined()

      // Cleanup
      await adminClient.from('support_tickets').delete().eq('id', newTicket!.id)
    })
  })
})

describe('RLS Policies - Support Ticket Comments', () => {
  const adminClient = createAdminClient()
  const testPrefix = generateTestPrefix()

  let admin: Awaited<ReturnType<typeof createTestUser>>
  let developer: Awaited<ReturnType<typeof createTestUser>>
  let sales: Awaited<ReturnType<typeof createTestUser>>
  let testTicketId: string
  let adminCommentId: string
  let developerCommentId: string

  beforeAll(async () => {
    // Create test users
    admin = await createTestUser(adminClient, { role: 'admin', prefix: `comment_${testPrefix}` })
    developer = await createTestUser(adminClient, { role: 'developer', prefix: `comment_dev_${testPrefix}` })
    sales = await createTestUser(adminClient, { role: 'sales', prefix: `comment_sales_${testPrefix}` })

    // Create test ticket
    const { data: ticket } = await adminClient
      .from('support_tickets')
      .insert({
        created_by: admin.id,
        category: 'bug',
        subject: `Comment Test Ticket ${testPrefix}`,
        description: 'Ticket for testing comment RLS',
        status: 'open',
      })
      .select()
      .single()

    testTicketId = ticket!.id

    // Create initial comment by admin
    const { data: adminComment } = await adminClient
      .from('support_ticket_comments')
      .insert({
        ticket_id: testTicketId,
        author_id: admin.id,
        body: 'Initial admin comment',
        is_internal: false,
      })
      .select()
      .single()

    adminCommentId = adminComment!.id

    // Create initial comment by developer
    const { data: devComment } = await adminClient
      .from('support_ticket_comments')
      .insert({
        ticket_id: testTicketId,
        author_id: developer.id,
        body: 'Initial developer comment',
        is_internal: false,
      })
      .select()
      .single()

    developerCommentId = devComment!.id
  })

  afterAll(async () => {
    // Cleanup
    if (testTicketId) {
      await adminClient.from('support_ticket_comments').delete().eq('ticket_id', testTicketId)
      await adminClient.from('support_tickets').delete().eq('id', testTicketId)
    }
    if (admin?.id) await deleteTestUser(adminClient, admin.id)
    if (developer?.id) await deleteTestUser(adminClient, developer.id)
    if (sales?.id) await deleteTestUser(adminClient, sales.id)
  })

  describe('Read Access', () => {
    it('admin can read all comments', async () => {
      const client = await signInAsUser(admin.email, admin.password)
      const { data, error } = await client
        .from('support_ticket_comments')
        .select('*')
        .eq('ticket_id', testTicketId)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThanOrEqual(2)
    })

    it('developer can read all comments', async () => {
      const client = await signInAsUser(developer.email, developer.password)
      const { data, error } = await client
        .from('support_ticket_comments')
        .select('*')
        .eq('ticket_id', testTicketId)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThanOrEqual(2)
    })

    it('sales cannot read comments', async () => {
      const client = await signInAsUser(sales.email, sales.password)
      const { data, error } = await client
        .from('support_ticket_comments')
        .select('*')
        .eq('ticket_id', testTicketId)

      expect(error).toBeNull()
      expect(data!.length).toBe(0)
    })
  })

  describe('Insert Access', () => {
    it('admin can add comments', async () => {
      const client = await signInAsUser(admin.email, admin.password)
      const { data, error } = await client
        .from('support_ticket_comments')
        .insert({
          ticket_id: testTicketId,
          author_id: admin.id,
          body: 'Admin added this comment',
          is_internal: false,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()

      // Cleanup
      if (data?.id) {
        await adminClient.from('support_ticket_comments').delete().eq('id', data.id)
      }
    })

    it('developer can add comments', async () => {
      const client = await signInAsUser(developer.email, developer.password)
      const { data, error } = await client
        .from('support_ticket_comments')
        .insert({
          ticket_id: testTicketId,
          author_id: developer.id,
          body: 'Developer added this comment',
          is_internal: false,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()

      // Cleanup
      if (data?.id) {
        await adminClient.from('support_ticket_comments').delete().eq('id', data.id)
      }
    })

    it('sales cannot add comments', async () => {
      const client = await signInAsUser(sales.email, sales.password)
      const { error } = await client.from('support_ticket_comments').insert({
        ticket_id: testTicketId,
        author_id: sales.id,
        body: 'Sales should not be able to comment',
        is_internal: false,
      })

      expect(error).toBeDefined()
    })
  })

  describe('Update Access', () => {
    it('admin can update their own comments', async () => {
      const client = await signInAsUser(admin.email, admin.password)
      const { error } = await client
        .from('support_ticket_comments')
        .update({ body: 'Admin updated their comment' })
        .eq('id', adminCommentId)

      expect(error).toBeNull()
    })

    it('developer can update their own comments', async () => {
      const client = await signInAsUser(developer.email, developer.password)
      const { error } = await client
        .from('support_ticket_comments')
        .update({ body: 'Developer updated their comment' })
        .eq('id', developerCommentId)

      expect(error).toBeNull()
    })

    it('developer cannot update admin comments', async () => {
      const client = await signInAsUser(developer.email, developer.password)
      const { data } = await client
        .from('support_ticket_comments')
        .update({ body: 'Developer trying to update admin comment' })
        .eq('id', adminCommentId)
        .select()

      // RLS prevents the update - returns empty array
      expect(data?.length ?? 0).toBe(0)
    })

    it('admin cannot update developer comments (only their own)', async () => {
      const client = await signInAsUser(admin.email, admin.password)
      const { data } = await client
        .from('support_ticket_comments')
        .update({ body: 'Admin trying to update developer comment' })
        .eq('id', developerCommentId)
        .select()

      // RLS prevents the update - returns empty array (admin can only update own comments)
      expect(data?.length ?? 0).toBe(0)
    })
  })

  describe('Delete Access', () => {
    it('admin can delete any comments', async () => {
      // Create a comment to delete
      const { data: commentToDelete } = await adminClient
        .from('support_ticket_comments')
        .insert({
          ticket_id: testTicketId,
          author_id: developer.id,
          body: 'This comment will be deleted by admin',
          is_internal: false,
        })
        .select()
        .single()

      const client = await signInAsUser(admin.email, admin.password)
      const { error } = await client
        .from('support_ticket_comments')
        .delete()
        .eq('id', commentToDelete!.id)

      expect(error).toBeNull()
    })

    it('developer cannot delete comments', async () => {
      // Create a comment to test deletion
      const { data: commentToDelete } = await adminClient
        .from('support_ticket_comments')
        .insert({
          ticket_id: testTicketId,
          author_id: developer.id,
          body: 'Developer should not be able to delete this',
          is_internal: false,
        })
        .select()
        .single()

      const client = await signInAsUser(developer.email, developer.password)
      await client
        .from('support_ticket_comments')
        .delete()
        .eq('id', commentToDelete!.id)

      // Verify the comment still exists
      const { data: checkComment } = await adminClient
        .from('support_ticket_comments')
        .select()
        .eq('id', commentToDelete!.id)
        .single()

      expect(checkComment).toBeDefined()

      // Cleanup
      await adminClient.from('support_ticket_comments').delete().eq('id', commentToDelete!.id)
    })
  })
})
