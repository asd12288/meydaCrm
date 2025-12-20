import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Cleanup all test data after tests complete
 * Identifies test data by:
 * - Users: username starts with test_
 * - Leads: email contains @example.com or names contain test prefixes
 * - Import jobs: created by test users
 */
export async function cleanupAllTestData(adminClient: SupabaseClient): Promise<void> {
  try {
    // 1. Find all test users
    const { data: testProfiles } = await adminClient
      .from('profiles')
      .select('id')
      .ilike('username', 'test_%')

    if (testProfiles && testProfiles.length > 0) {
      const testUserIds = testProfiles.map((p) => p.id)

      // 2. Delete leads assigned to test users (comments/history cascade or delete first)
      const { data: assignedLeads } = await adminClient
        .from('leads')
        .select('id')
        .in('assigned_to', testUserIds)

      if (assignedLeads && assignedLeads.length > 0) {
        const leadIds = assignedLeads.map((l) => l.id)
        await adminClient.from('lead_comments').delete().in('lead_id', leadIds)
        await adminClient.from('lead_history').delete().in('lead_id', leadIds)
      }

      // 3. Delete leads with test patterns
      await adminClient
        .from('leads')
        .delete()
        .or('email.ilike.%@example.com,last_name.ilike.%_test_%,first_name.ilike.test%')

      // 4. Delete import jobs by test users (rows cascade)
      const { data: jobs } = await adminClient
        .from('import_jobs')
        .select('id, storage_path')
        .in('created_by', testUserIds)

      if (jobs && jobs.length > 0) {
        const paths = jobs.map((j) => j.storage_path).filter(Boolean)
        if (paths.length > 0) {
          await adminClient.storage.from('imports').remove(paths)
        }
        await adminClient.from('import_jobs').delete().in('id', jobs.map((j) => j.id))
      }

      // 5. Delete test users
      for (const profile of testProfiles) {
        await adminClient.auth.admin.deleteUser(profile.id).catch(() => {})
      }
    }
  } catch {
    // Silent cleanup - don't fail tests if cleanup has issues
  }
}
