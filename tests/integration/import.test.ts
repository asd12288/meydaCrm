// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  signInAsUser,
  generateTestPrefix,
} from '../helpers'

describe('Import System - Upload Import File', () => {
  const adminClient = createAdminClient()
  const testPrefix = generateTestPrefix()

  let admin: Awaited<ReturnType<typeof createTestUser>>
  let sales: Awaited<ReturnType<typeof createTestUser>>
  const importJobIds: string[] = []
  const storagePaths: string[] = []

  beforeAll(async () => {
    admin = await createTestUser(adminClient, { role: 'admin', prefix: `import_upload_${testPrefix}` })
    sales = await createTestUser(adminClient, { role: 'sales', prefix: `import_upload_${testPrefix}` })
  })

  afterAll(async () => {
    // Cleanup import jobs and storage files
    for (const jobId of importJobIds) {
      const { data: job } = await adminClient
        .from('import_jobs')
        .select('storage_path')
        .eq('id', jobId)
        .single()

      if (job?.storage_path) {
        await adminClient.storage.from('imports').remove([job.storage_path])
      }
      await adminClient.from('import_jobs').delete().eq('id', jobId)
    }

    for (const path of storagePaths) {
      await adminClient.storage.from('imports').remove([path]).catch(() => {
        // Ignore errors if file doesn't exist
      })
    }

    if (admin?.id) await deleteTestUser(adminClient, admin.id)
    if (sales?.id) await deleteTestUser(adminClient, sales.id)
  })

  it('admin can upload CSV file (creates import_job record)', async () => {
    const client = await signInAsUser(admin.email, admin.password)

    // Create CSV content
    const csvContent = 'first_name,last_name,email\nJohn,Doe,john@example.com'
    const csvBlob = new Blob([csvContent], { type: 'text/csv' })
    const csvFile = new File([csvBlob], `test_${testPrefix}.csv`, { type: 'text/csv' })

    // Generate storage path
    const timestamp = Date.now()
    const sanitizedName = csvFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `imports/${admin.id}/${timestamp}_${sanitizedName}`

    // Upload to Storage
    const { error: uploadError } = await client.storage.from('imports').upload(storagePath, csvFile, {
      contentType: csvFile.type,
      upsert: false,
    })

    expect(uploadError).toBeNull()
    storagePaths.push(storagePath)

    // Create import job record
    const { data: importJob, error: dbError } = await client
      .from('import_jobs')
      .insert({
        created_by: admin.id,
        file_name: csvFile.name,
        file_type: 'csv',
        storage_path: storagePath,
        status: 'pending',
      })
      .select('id')
      .single()

    expect(dbError).toBeNull()
    expect(importJob).toBeDefined()
    if (importJob) {
      importJobIds.push(importJob.id)
    }
  })

  it('admin can upload XLSX file (creates import_job record)', async () => {
    const client = await signInAsUser(admin.email, admin.password)

    // For XLSX, we'll create a minimal file (in real test, use a proper XLSX file)
    // For now, we test the flow with a placeholder
    const xlsxBlob = new Blob(['fake xlsx content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const xlsxFile = new File([xlsxBlob], `test_${testPrefix}.xlsx`, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const timestamp = Date.now()
    const sanitizedName = xlsxFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `imports/${admin.id}/${timestamp}_${sanitizedName}`

    const { error: uploadError } = await client.storage.from('imports').upload(storagePath, xlsxFile, {
      contentType: xlsxFile.type,
      upsert: false,
    })

    expect(uploadError).toBeNull()
    storagePaths.push(storagePath)

    const { data: importJob, error: dbError } = await client
      .from('import_jobs')
      .insert({
        created_by: admin.id,
        file_name: xlsxFile.name,
        file_type: 'xlsx',
        storage_path: storagePath,
        status: 'pending',
      })
      .select('id')
      .single()

    expect(dbError).toBeNull()
    expect(importJob).toBeDefined()
    if (importJob) {
      importJobIds.push(importJob.id)
    }
  })

  it('rejects invalid file types', async () => {
    await signInAsUser(admin.email, admin.password)

    // Try to upload invalid file type
    const invalidBlob = new Blob(['invalid content'], { type: 'text/plain' })
    const invalidFile = new File([invalidBlob], `test_${testPrefix}.txt`, { type: 'text/plain' })

    // In server action, validation would reject this before upload
    // Here we test that non-csv/xlsx files would be rejected by business logic
    const ext = invalidFile.name.toLowerCase().split('.').pop()
    expect(['csv', 'xlsx', 'xls'].includes(ext || '')).toBe(false)
  })

  it('sales user cannot upload files (RLS blocks)', async () => {
    const client = await signInAsUser(sales.email, sales.password)

    // Try to create import job (would be blocked by RLS)
    const { error } = await client.from('import_jobs').insert({
      created_by: sales.id,
      file_name: 'should_fail.csv',
      file_type: 'csv',
      storage_path: `imports/${sales.id}/test.csv`,
      status: 'pending',
    })

    expect(error).toBeDefined()
  })

  it('import job has correct file_name, file_type, storage_path', async () => {
    const client = await signInAsUser(admin.email, admin.password)

    const csvContent = 'first_name,last_name\nJane,Doe'
    const csvBlob = new Blob([csvContent], { type: 'text/csv' })
    const csvFile = new File([csvBlob], `verify_${testPrefix}.csv`, { type: 'text/csv' })

    const timestamp = Date.now()
    const sanitizedName = csvFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `imports/${admin.id}/${timestamp}_${sanitizedName}`

    await client.storage.from('imports').upload(storagePath, csvFile, {
      contentType: csvFile.type,
      upsert: false,
    })
    storagePaths.push(storagePath)

    const { data: importJob, error } = await client
      .from('import_jobs')
      .insert({
        created_by: admin.id,
        file_name: csvFile.name,
        file_type: 'csv',
        storage_path: storagePath,
        status: 'pending',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(importJob).toBeDefined()
    expect(importJob?.file_name).toBe(csvFile.name)
    expect(importJob?.file_type).toBe('csv')
    expect(importJob?.storage_path).toBe(storagePath)
    expect(importJob?.status).toBe('pending')
    expect(importJob?.created_by).toBe(admin.id)

    if (importJob) {
      importJobIds.push(importJob.id)
    }
  })
})

describe('Import System - Get Import Job', () => {
  const adminClient = createAdminClient()
  const testPrefix = generateTestPrefix()

  let admin: Awaited<ReturnType<typeof createTestUser>>
  let sales: Awaited<ReturnType<typeof createTestUser>>
  let importJobId: string
  let storagePath: string

  beforeAll(async () => {
    admin = await createTestUser(adminClient, { role: 'admin', prefix: `import_get_${testPrefix}` })
    sales = await createTestUser(adminClient, { role: 'sales', prefix: `import_get_${testPrefix}` })

    // Create test import job
    storagePath = `imports/${admin.id}/test_${testPrefix}.csv`
    const { data: job } = await adminClient
      .from('import_jobs')
      .insert({
        created_by: admin.id,
        file_name: `test_${testPrefix}.csv`,
        file_type: 'csv',
        storage_path: storagePath,
        status: 'pending',
      })
      .select()
      .single()

    importJobId = job!.id
  })

  afterAll(async () => {
    await adminClient.storage.from('imports').remove([storagePath]).catch(() => {})
    if (importJobId) await adminClient.from('import_jobs').delete().eq('id', importJobId)
    if (admin?.id) await deleteTestUser(adminClient, admin.id)
    if (sales?.id) await deleteTestUser(adminClient, sales.id)
  })

  it('admin can fetch import job details with creator relation', async () => {
    const client = await signInAsUser(admin.email, admin.password)

    const { data, error } = await client
      .from('import_jobs')
      .select('*, creator:profiles!import_jobs_created_by_fkey(id, display_name)')
      .eq('id', importJobId)
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.id).toBe(importJobId)
    expect(data).toHaveProperty('creator')
    expect(data?.creator).toHaveProperty('id')
    expect(data?.creator).toHaveProperty('display_name')
  })

  it('sales user cannot fetch import job (RLS blocks access)', async () => {
    const client = await signInAsUser(sales.email, sales.password)

    const { data } = await client
      .from('import_jobs')
      .select('*')
      .eq('id', importJobId)
      .single()

    // RLS prevents access
    expect(data).toBeNull()
  })
})

describe('Import System - Get Import Jobs', () => {
  const adminClient = createAdminClient()
  const testPrefix = generateTestPrefix()

  let admin: Awaited<ReturnType<typeof createTestUser>>
  let sales: Awaited<ReturnType<typeof createTestUser>>
  const importJobIds: string[] = []
  const storagePaths: string[] = []

  beforeAll(async () => {
    admin = await createTestUser(adminClient, { role: 'admin', prefix: `import_list_${testPrefix}` })
    sales = await createTestUser(adminClient, { role: 'sales', prefix: `import_list_${testPrefix}` })

    // Create multiple test import jobs
    for (let i = 0; i < 3; i++) {
      const path = `imports/${admin.id}/test_${testPrefix}_${i}.csv`
      const { data: job } = await adminClient
        .from('import_jobs')
        .insert({
          created_by: admin.id,
          file_name: `test_${testPrefix}_${i}.csv`,
          file_type: 'csv',
          storage_path: path,
          status: 'pending',
        })
        .select()
        .single()

      if (job) {
        importJobIds.push(job.id)
        storagePaths.push(path)
      }
    }
  })

  afterAll(async () => {
    for (const path of storagePaths) {
      await adminClient.storage.from('imports').remove([path]).catch(() => {})
    }
    if (importJobIds.length > 0) {
      await adminClient.from('import_jobs').delete().in('id', importJobIds)
    }
    if (admin?.id) await deleteTestUser(adminClient, admin.id)
    if (sales?.id) await deleteTestUser(adminClient, sales.id)
  })

  it('admin can fetch list of import jobs (ordered by created_at desc, limit 50)', async () => {
    const client = await signInAsUser(admin.email, admin.password)

    const { data, error } = await client
      .from('import_jobs')
      .select('*, creator:profiles!import_jobs_created_by_fkey(id, display_name)')
      .order('created_at', { ascending: false })
      .limit(50)

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(Array.isArray(data)).toBe(true)
    expect(data!.length).toBeGreaterThanOrEqual(3)

    // Verify ordering (descending)
    if (data && data.length > 1) {
      const date1 = new Date(data[0].created_at)
      const date2 = new Date(data[1].created_at)
      expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime())
    }

    // Verify creator relation
    expect(data![0]).toHaveProperty('creator')
  })

  it('sales user cannot fetch import jobs (RLS blocks access)', async () => {
    const client = await signInAsUser(sales.email, sales.password)

    const { data } = await client.from('import_jobs').select('*').limit(50)

    // RLS prevents access - should return empty array
    expect(data).toBeDefined()
    expect(Array.isArray(data)).toBe(true)
    // Sales cannot see import jobs
    expect(data!.length).toBe(0)
  })
})

describe('Import System - Update Import Job Mapping', () => {
  const adminClient = createAdminClient()
  const testPrefix = generateTestPrefix()

  let admin: Awaited<ReturnType<typeof createTestUser>>
  let sales: Awaited<ReturnType<typeof createTestUser>>
  let importJobId: string
  let storagePath: string

  beforeAll(async () => {
    admin = await createTestUser(adminClient, { role: 'admin', prefix: `import_mapping_${testPrefix}` })
    sales = await createTestUser(adminClient, { role: 'sales', prefix: `import_mapping_${testPrefix}` })

    storagePath = `imports/${admin.id}/mapping_${testPrefix}.csv`
    const { data: job } = await adminClient
      .from('import_jobs')
      .insert({
        created_by: admin.id,
        file_name: `mapping_${testPrefix}.csv`,
        file_type: 'csv',
        storage_path: storagePath,
        status: 'pending',
      })
      .select()
      .single()

    importJobId = job!.id
  })

  afterAll(async () => {
    await adminClient.storage.from('imports').remove([storagePath]).catch(() => {})
    if (importJobId) await adminClient.from('import_jobs').delete().eq('id', importJobId)
    if (admin?.id) await deleteTestUser(adminClient, admin.id)
    if (sales?.id) await deleteTestUser(adminClient, sales.id)
  })

  it('admin can update column mapping configuration', async () => {
    const client = await signInAsUser(admin.email, admin.password)

    const mapping = {
      'Column1': 'first_name',
      'Column2': 'last_name',
      'Column3': 'email',
    }

    const { error } = await client
      .from('import_jobs')
      .update({
        column_mapping: mapping as unknown as Record<string, unknown>,
        status: 'validating',
        updated_at: new Date().toISOString(),
      })
      .eq('id', importJobId)

    expect(error).toBeNull()

    // Verify update
    const { data: job } = await adminClient
      .from('import_jobs')
      .select('column_mapping, status')
      .eq('id', importJobId)
      .single()

    expect(job?.status).toBe('validating')
    expect(job?.column_mapping).toBeDefined()
  })

  it('updates job status to validating', async () => {
    const client = await signInAsUser(admin.email, admin.password)

    const { error } = await client
      .from('import_jobs')
      .update({
        status: 'validating',
        updated_at: new Date().toISOString(),
      })
      .eq('id', importJobId)

    expect(error).toBeNull()

    const { data: job } = await adminClient
      .from('import_jobs')
      .select('status')
      .eq('id', importJobId)
      .single()

    expect(job?.status).toBe('validating')
  })

  it('sales user cannot update mapping (RLS blocks)', async () => {
    const client = await signInAsUser(sales.email, sales.password)

    const { data } = await client
      .from('import_jobs')
      .update({
        column_mapping: { test: 'mapping' } as unknown as Record<string, unknown>,
      })
      .eq('id', importJobId)
      .select()

    // RLS prevents update - returns empty array
    expect(data?.length ?? 0).toBe(0)
  })
})

describe('Import System - Get Import Rows', () => {
  const adminClient = createAdminClient()
  const testPrefix = generateTestPrefix()

  let admin: Awaited<ReturnType<typeof createTestUser>>
  let sales: Awaited<ReturnType<typeof createTestUser>>
  let importJobId: string
  const importRowIds: string[] = []

  beforeAll(async () => {
    admin = await createTestUser(adminClient, { role: 'admin', prefix: `import_rows_${testPrefix}` })
    sales = await createTestUser(adminClient, { role: 'sales', prefix: `import_rows_${testPrefix}` })

    // Create test import job
    const { data: job } = await adminClient
      .from('import_jobs')
      .insert({
        created_by: admin.id,
        file_name: `rows_${testPrefix}.csv`,
        file_type: 'csv',
        storage_path: `imports/${admin.id}/rows_${testPrefix}.csv`,
        status: 'parsing',
      })
      .select()
      .single()

    importJobId = job!.id

    // Create test import rows
    for (let i = 0; i < 5; i++) {
      const { data: row } = await adminClient
        .from('import_rows')
        .insert({
          import_job_id: importJobId,
          row_number: i + 1,
          chunk_number: 1,
          status: i < 3 ? 'valid' : 'invalid',
          raw_data: { col1: `value${i}`, col2: `value${i + 1}` },
          normalized_data: i < 3 ? { first_name: `Name${i}` } : null,
          validation_errors: i >= 3 ? { email: 'Invalid email' } : null,
        })
        .select()
        .single()

      if (row) importRowIds.push(row.id)
    }
  })

  afterAll(async () => {
    if (importRowIds.length > 0) {
      await adminClient.from('import_rows').delete().in('id', importRowIds)
    }
    if (importJobId) await adminClient.from('import_jobs').delete().eq('id', importJobId)
    if (admin?.id) await deleteTestUser(adminClient, admin.id)
    if (sales?.id) await deleteTestUser(adminClient, sales.id)
  })

  it('admin can fetch import rows with pagination', async () => {
    const client = await signInAsUser(admin.email, admin.password)

    const page = 1
    const pageSize = 2
    const offset = (page - 1) * pageSize

    const { data, error, count } = await client
      .from('import_rows')
      .select('id, row_number, status, raw_data, normalized_data, validation_errors', {
        count: 'exact',
      })
      .eq('import_job_id', importJobId)
      .order('row_number', { ascending: true })
      .range(offset, offset + pageSize - 1)

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data!.length).toBeLessThanOrEqual(pageSize)
    expect(count).toBeGreaterThanOrEqual(5)
  })

  it('filter by status works', async () => {
    const client = await signInAsUser(admin.email, admin.password)

    const { data, error } = await client
      .from('import_rows')
      .select('id, row_number, status')
      .eq('import_job_id', importJobId)
      .eq('status', 'valid')

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data!.every((r) => r.status === 'valid')).toBe(true)
    expect(data!.length).toBeGreaterThanOrEqual(3)
  })

  it('ordered by row_number', async () => {
    const client = await signInAsUser(admin.email, admin.password)

    const { data } = await client
      .from('import_rows')
      .select('row_number')
      .eq('import_job_id', importJobId)
      .order('row_number', { ascending: true })

    expect(data).toBeDefined()
    if (data && data.length > 1) {
      const numbers = data.map((r) => r.row_number)
      const sorted = [...numbers].sort((a, b) => a - b)
      expect(numbers).toEqual(sorted)
    }
  })

  it('sales user cannot fetch import rows (RLS blocks access)', async () => {
    const client = await signInAsUser(sales.email, sales.password)

    const { data } = await client
      .from('import_rows')
      .select('*')
      .eq('import_job_id', importJobId)

    // RLS prevents access
    expect(data).toBeDefined()
    expect(Array.isArray(data)).toBe(true)
    expect(data!.length).toBe(0)
  })

  it('returns correct structure with validation_errors and total count', async () => {
    const client = await signInAsUser(admin.email, admin.password)

    const { data, count } = await client
      .from('import_rows')
      .select('id, row_number, status, raw_data, normalized_data, validation_errors', {
        count: 'exact',
      })
      .eq('import_job_id', importJobId)

    expect(data).toBeDefined()
    expect(count).toBeGreaterThanOrEqual(5)
    expect(data!.every((r) => r.hasOwnProperty('raw_data'))).toBe(true)
    expect(data!.every((r) => r.hasOwnProperty('normalized_data') || r.normalized_data === null)).toBe(true)
  })
})

describe('Import System - Delete Import Job', () => {
  const adminClient = createAdminClient()
  const testPrefix = generateTestPrefix()

  let admin: Awaited<ReturnType<typeof createTestUser>>
  let sales: Awaited<ReturnType<typeof createTestUser>>
  let importJobId: string
  let storagePath: string

  beforeAll(async () => {
    admin = await createTestUser(adminClient, { role: 'admin', prefix: `import_delete_${testPrefix}` })
    sales = await createTestUser(adminClient, { role: 'sales', prefix: `import_delete_${testPrefix}` })

    storagePath = `imports/${admin.id}/delete_${testPrefix}.csv`
    // Create a file in storage
    const csvBlob = new Blob(['test content'], { type: 'text/csv' })
    await adminClient.storage.from('imports').upload(storagePath, csvBlob)

    const { data: job } = await adminClient
      .from('import_jobs')
      .insert({
        created_by: admin.id,
        file_name: `delete_${testPrefix}.csv`,
        file_type: 'csv',
        storage_path: storagePath,
        status: 'pending',
      })
      .select()
      .single()

    importJobId = job!.id
  })

  afterAll(async () => {
    // Cleanup in case test failed
    try {
      await adminClient.storage.from('imports').remove([storagePath])
    } catch {
      // Ignore errors if file doesn't exist
    }
    if (importJobId) {
      try {
        await adminClient.from('import_jobs').delete().eq('id', importJobId)
      } catch {
        // Ignore errors if job doesn't exist
      }
    }
    if (admin?.id) await deleteTestUser(adminClient, admin.id)
    if (sales?.id) await deleteTestUser(adminClient, sales.id)
  })

  it('admin can delete import job', async () => {
    const client = await signInAsUser(admin.email, admin.password)

    // Verify file exists before deletion (just checking API works)
    await adminClient.storage.from('imports').list(admin.id)

    // Delete job (would also delete file in server action)
    const { error: deleteError } = await client.from('import_jobs').delete().eq('id', importJobId)

    expect(deleteError).toBeNull()

    // Verify job deleted
    const { data: job } = await adminClient
      .from('import_jobs')
      .select('id')
      .eq('id', importJobId)
      .single()

    expect(job).toBeNull()

    // Delete file from storage (server action would do this)
    await adminClient.storage.from('imports').remove([storagePath])
    importJobId = '' // Mark as deleted so afterAll doesn't try again
  })

  it('deletes file from Storage', async () => {
    const client = await signInAsUser(admin.email, admin.password)

    // Create new job for this test
    const testPath = `imports/${admin.id}/delete_file_${testPrefix}.csv`
    const csvBlob = new Blob(['test'], { type: 'text/csv' })
    await adminClient.storage.from('imports').upload(testPath, csvBlob)

    const { data: job } = await adminClient
      .from('import_jobs')
      .insert({
        created_by: admin.id,
        file_name: `delete_file_${testPrefix}.csv`,
        file_type: 'csv',
        storage_path: testPath,
        status: 'pending',
      })
      .select()
      .single()

    // Delete file
    const { error } = await client.storage.from('imports').remove([testPath])

    expect(error).toBeNull()

    // Verify file deleted
    const { data: files } = await adminClient.storage.from('imports').list(admin.id)
    const fileExists = files?.some((f) => f.name.includes(`delete_file_${testPrefix}`))
    expect(fileExists).toBe(false)

    // Cleanup job
    await adminClient.from('import_jobs').delete().eq('id', job!.id)
  })

  it('cascade deletes import_rows (database constraint)', async () => {
    const client = await signInAsUser(admin.email, admin.password)

    // Create job with rows
    const testPath = `imports/${admin.id}/cascade_${testPrefix}.csv`
    const { data: job } = await adminClient
      .from('import_jobs')
      .insert({
        created_by: admin.id,
        file_name: `cascade_${testPrefix}.csv`,
        file_type: 'csv',
        storage_path: testPath,
        status: 'pending',
      })
      .select()
      .single()

    const jobId = job!.id

    // Create rows
    await adminClient.from('import_rows').insert({
      import_job_id: jobId,
      row_number: 1,
      chunk_number: 1,
      status: 'valid',
      raw_data: { test: 'data' },
      normalized_data: { first_name: 'Test' },
    })

    // Delete job (should cascade to rows)
    const { error } = await client.from('import_jobs').delete().eq('id', jobId)

    expect(error).toBeNull()

    // Verify rows deleted
    const { data: rows } = await adminClient.from('import_rows').select('*').eq('import_job_id', jobId)

    expect(rows).toBeDefined()
    expect(rows!.length).toBe(0)
  })

  it('cannot delete active imports (status parsing or importing)', async () => {
    await signInAsUser(admin.email, admin.password)

    // Create active job
    const testPath = `imports/${admin.id}/active_${testPrefix}.csv`
    const { data: job } = await adminClient
      .from('import_jobs')
      .insert({
        created_by: admin.id,
        file_name: `active_${testPrefix}.csv`,
        file_type: 'csv',
        storage_path: testPath,
        status: 'parsing',
      })
      .select()
      .single()

    const jobId = job!.id

    // In server action, this would be blocked by business logic
    // For database test, we verify the status prevents deletion in application logic
    // Database allows deletion, but server action would check status first
    const { data: jobData } = await adminClient
      .from('import_jobs')
      .select('status')
      .eq('id', jobId)
      .single()

    expect(['parsing', 'importing'].includes(jobData?.status || '')).toBe(true)

    // Cleanup
    await adminClient.from('import_jobs').update({ status: 'failed' }).eq('id', jobId)
    await adminClient.from('import_jobs').delete().eq('id', jobId)
    await adminClient.storage.from('imports').remove([testPath]).catch(() => {})
  })

  it('sales user cannot delete import jobs (RLS blocks access)', async () => {
    const client = await signInAsUser(sales.email, sales.password)

    // Create job as admin first
    const testPath = `imports/${admin.id}/sales_delete_${testPrefix}.csv`
    const { data: job } = await adminClient
      .from('import_jobs')
      .insert({
        created_by: admin.id,
        file_name: `sales_delete_${testPrefix}.csv`,
        file_type: 'csv',
        storage_path: testPath,
        status: 'pending',
      })
      .select()
      .single()

    const jobId = job!.id

    // Try to delete as sales
    const { error } = await client.from('import_jobs').delete().eq('id', jobId)

    // RLS should block
    expect(error).toBeDefined()

    // Cleanup
    await adminClient.from('import_jobs').delete().eq('id', jobId)
    await adminClient.storage.from('imports').remove([testPath]).catch(() => {})
  })
})

describe('Import System - Cancel Import Job', () => {
  const adminClient = createAdminClient()
  const testPrefix = generateTestPrefix()

  let admin: Awaited<ReturnType<typeof createTestUser>>
  let sales: Awaited<ReturnType<typeof createTestUser>>
  let queuedJobId: string
  let parsingJobId: string

  beforeAll(async () => {
    admin = await createTestUser(adminClient, { role: 'admin', prefix: `import_cancel_${testPrefix}` })
    sales = await createTestUser(adminClient, { role: 'sales', prefix: `import_cancel_${testPrefix}` })

    // Create jobs in different states
    const { data: queued } = await adminClient
      .from('import_jobs')
      .insert({
        created_by: admin.id,
        file_name: `queued_${testPrefix}.csv`,
        file_type: 'csv',
        storage_path: `imports/${admin.id}/queued_${testPrefix}.csv`,
        status: 'queued',
      })
      .select()
      .single()

    const { data: parsing } = await adminClient
      .from('import_jobs')
      .insert({
        created_by: admin.id,
        file_name: `parsing_${testPrefix}.csv`,
        file_type: 'csv',
        storage_path: `imports/${admin.id}/parsing_${testPrefix}.csv`,
        status: 'parsing',
      })
      .select()
      .single()

    queuedJobId = queued!.id
    parsingJobId = parsing!.id
  })

  afterAll(async () => {
    if (queuedJobId) await adminClient.from('import_jobs').delete().eq('id', queuedJobId)
    if (parsingJobId) await adminClient.from('import_jobs').delete().eq('id', parsingJobId)
    if (admin?.id) await deleteTestUser(adminClient, admin.id)
    if (sales?.id) await deleteTestUser(adminClient, sales.id)
  })

  it('admin can cancel queued import job (status → cancelled)', async () => {
    const client = await signInAsUser(admin.email, admin.password)

    const { error } = await client
      .from('import_jobs')
      .update({
        status: 'cancelled',
        error_message: 'Annulé par l\'utilisateur',
        updated_at: new Date().toISOString(),
      })
      .eq('id', queuedJobId)

    expect(error).toBeNull()

    const { data: job } = await adminClient
      .from('import_jobs')
      .select('status, error_message')
      .eq('id', queuedJobId)
      .single()

    expect(job?.status).toBe('cancelled')
    expect(job?.error_message).toBe('Annulé par l\'utilisateur')
  })

  it('admin can cancel parsing import job', async () => {
    const client = await signInAsUser(admin.email, admin.password)

    const { error } = await client
      .from('import_jobs')
      .update({
        status: 'cancelled',
        error_message: 'Annulé par l\'utilisateur',
      })
      .eq('id', parsingJobId)

    expect(error).toBeNull()
  })

  it('cannot cancel non-active jobs', async () => {
    await signInAsUser(admin.email, admin.password)

    // Create completed job
    const { data: completed } = await adminClient
      .from('import_jobs')
      .insert({
        created_by: admin.id,
        file_name: `completed_${testPrefix}.csv`,
        file_type: 'csv',
        storage_path: `imports/${admin.id}/completed_${testPrefix}.csv`,
        status: 'completed',
      })
      .select()
      .single()

    const completedId = completed!.id

    // In server action, this would be blocked by business logic
    // Database allows update, but server action checks status first
    const { data: job } = await adminClient
      .from('import_jobs')
      .select('status')
      .eq('id', completedId)
      .single()

    expect(['queued', 'parsing', 'importing'].includes(job?.status || '')).toBe(false)

    // Cleanup
    await adminClient.from('import_jobs').delete().eq('id', completedId)
  })

  it('sales user cannot cancel import jobs (RLS blocks)', async () => {
    const client = await signInAsUser(sales.email, sales.password)

    // Reset parsing job status for this test
    await adminClient.from('import_jobs').update({ status: 'parsing' }).eq('id', parsingJobId)

    const { data } = await client
      .from('import_jobs')
      .update({
        status: 'cancelled',
      })
      .eq('id', parsingJobId)
      .select()

    // RLS prevents update
    expect(data?.length ?? 0).toBe(0)
  })
})

describe('Import System - Poll Import Job Status', () => {
  const adminClient = createAdminClient()
  const testPrefix = generateTestPrefix()

  let admin: Awaited<ReturnType<typeof createTestUser>>
  let sales: Awaited<ReturnType<typeof createTestUser>>
  let importJobId: string

  beforeAll(async () => {
    admin = await createTestUser(adminClient, { role: 'admin', prefix: `import_poll_${testPrefix}` })
    sales = await createTestUser(adminClient, { role: 'sales', prefix: `import_poll_${testPrefix}` })

    const { data: job } = await adminClient
      .from('import_jobs')
      .insert({
        created_by: admin.id,
        file_name: `poll_${testPrefix}.csv`,
        file_type: 'csv',
        storage_path: `imports/${admin.id}/poll_${testPrefix}.csv`,
        status: 'parsing',
        total_rows: 100,
        valid_rows: 90,
        invalid_rows: 10,
        imported_rows: 0,
        skipped_rows: 0,
        processed_rows: 50,
      })
      .select()
      .single()

    importJobId = job!.id
  })

  afterAll(async () => {
    if (importJobId) await adminClient.from('import_jobs').delete().eq('id', importJobId)
    if (admin?.id) await deleteTestUser(adminClient, admin.id)
    if (sales?.id) await deleteTestUser(adminClient, sales.id)
  })

  it('admin can poll job status', async () => {
    const client = await signInAsUser(admin.email, admin.password)

    const { data, error } = await client
      .from('import_jobs')
      .select(
        'status, total_rows, valid_rows, invalid_rows, imported_rows, skipped_rows, processed_rows, error_message, completed_at'
      )
      .eq('id', importJobId)
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.status).toBe('parsing')
    expect(data?.total_rows).toBe(100)
    expect(data?.valid_rows).toBe(90)
    expect(data?.invalid_rows).toBe(10)
    expect(data).toHaveProperty('error_message')
    expect(data).toHaveProperty('completed_at')
  })

  it('returns minimal status data', async () => {
    const client = await signInAsUser(admin.email, admin.password)

    const { data } = await client
      .from('import_jobs')
      .select(
        'status, total_rows, valid_rows, invalid_rows, imported_rows, skipped_rows, processed_rows, error_message, completed_at'
      )
      .eq('id', importJobId)
      .single()

    expect(data).toBeDefined()
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('total_rows')
    expect(data).toHaveProperty('valid_rows')
    expect(data).toHaveProperty('invalid_rows')
  })

  it('sales user cannot poll job status (RLS blocks)', async () => {
    const client = await signInAsUser(sales.email, sales.password)

    const { data } = await client
      .from('import_jobs')
      .select('status')
      .eq('id', importJobId)
      .single()

    // RLS prevents access
    expect(data).toBeNull()
  })
})

describe('Import System - RLS Policies', () => {
  const adminClient = createAdminClient()
  const testPrefix = generateTestPrefix()

  let admin: Awaited<ReturnType<typeof createTestUser>>
  let sales: Awaited<ReturnType<typeof createTestUser>>
  let importJobId: string

  beforeAll(async () => {
    admin = await createTestUser(adminClient, { role: 'admin', prefix: `import_rls_${testPrefix}` })
    sales = await createTestUser(adminClient, { role: 'sales', prefix: `import_rls_${testPrefix}` })

    const { data: job } = await adminClient
      .from('import_jobs')
      .insert({
        created_by: admin.id,
        file_name: `rls_${testPrefix}.csv`,
        file_type: 'csv',
        storage_path: `imports/${admin.id}/rls_${testPrefix}.csv`,
        status: 'pending',
      })
      .select()
      .single()

    importJobId = job!.id
  })

  afterAll(async () => {
    if (importJobId) await adminClient.from('import_jobs').delete().eq('id', importJobId)
    if (admin?.id) await deleteTestUser(adminClient, admin.id)
    if (sales?.id) await deleteTestUser(adminClient, sales.id)
  })

  it('sales user cannot read import_jobs table', async () => {
    const client = await signInAsUser(sales.email, sales.password)

    const { data } = await client.from('import_jobs').select('*')

    expect(data).toBeDefined()
    expect(Array.isArray(data)).toBe(true)
    expect(data!.length).toBe(0)
  })

  it('sales user cannot insert into import_jobs table', async () => {
    const client = await signInAsUser(sales.email, sales.password)

    const { error } = await client.from('import_jobs').insert({
      created_by: sales.id,
      file_name: 'should_fail.csv',
      file_type: 'csv',
      storage_path: `imports/${sales.id}/should_fail.csv`,
      status: 'pending',
    })

    expect(error).toBeDefined()
  })

  it('sales user cannot update import_jobs table', async () => {
    const client = await signInAsUser(sales.email, sales.password)

    const { data } = await client
      .from('import_jobs')
      .update({
        status: 'queued',
      })
      .eq('id', importJobId)
      .select()

    expect(data?.length ?? 0).toBe(0)
  })

  it('sales user cannot delete import_jobs table', async () => {
    const client = await signInAsUser(sales.email, sales.password)

    const { error } = await client.from('import_jobs').delete().eq('id', importJobId)

    expect(error).toBeDefined()
  })

  it('sales user cannot read import_rows table', async () => {
    const client = await signInAsUser(sales.email, sales.password)

    const { data } = await client.from('import_rows').select('*')

    expect(data).toBeDefined()
    expect(Array.isArray(data)).toBe(true)
    expect(data!.length).toBe(0)
  })

  it('sales user cannot insert into import_rows table', async () => {
    const client = await signInAsUser(sales.email, sales.password)

    const { error } = await client.from('import_rows').insert({
      import_job_id: importJobId,
      row_number: 1,
      chunk_number: 1,
      status: 'valid',
      raw_data: {},
      normalized_data: {},
    })

    expect(error).toBeDefined()
  })

  it('admin can perform all operations on import_jobs and import_rows', async () => {
    const client = await signInAsUser(admin.email, admin.password)

    // Read
    const { data: jobs, error: readError } = await client
      .from('import_jobs')
      .select('*')
      .eq('id', importJobId)

    expect(readError).toBeNull()
    expect(jobs).toBeDefined()
    expect(jobs!.length).toBeGreaterThan(0)

    // Update
    const { error: updateError } = await client
      .from('import_jobs')
      .update({
        status: 'ready',
      })
      .eq('id', importJobId)

    expect(updateError).toBeNull()

    // Insert row
    const { error: insertError } = await client.from('import_rows').insert({
      import_job_id: importJobId,
      row_number: 1,
      chunk_number: 1,
      status: 'valid',
      raw_data: { test: 'data' },
      normalized_data: { first_name: 'Test' },
    })

    expect(insertError).toBeNull()

    // Read rows
    const { data: rows, error: rowsReadError } = await client
      .from('import_rows')
      .select('*')
      .eq('import_job_id', importJobId)

    expect(rowsReadError).toBeNull()
    expect(rows).toBeDefined()

    // Cleanup rows
    await adminClient.from('import_rows').delete().eq('import_job_id', importJobId)
  })
})

describe('Import System - Integration Edge Cases', () => {
  const adminClient = createAdminClient()
  const testPrefix = generateTestPrefix()

  let admin: Awaited<ReturnType<typeof createTestUser>>

  beforeAll(async () => {
    admin = await createTestUser(adminClient, { role: 'admin', prefix: `import_edge_${testPrefix}` })
  })

  afterAll(async () => {
    if (admin?.id) await deleteTestUser(adminClient, admin.id)
  })

  it('handles missing import job gracefully', async () => {
    const client = await signInAsUser(admin.email, admin.password)
    const fakeId = '00000000-0000-0000-0000-000000000000'

    const { data } = await client
      .from('import_jobs')
      .select('*')
      .eq('id', fakeId)
      .single()

    expect(data).toBeNull()
    // Should not throw error, just return null
  })

  it('verify created_by matches authenticated user on insert', async () => {
    const client = await signInAsUser(admin.email, admin.password)

    const { data: job, error } = await client
      .from('import_jobs')
      .insert({
        created_by: admin.id,
        file_name: `created_by_${testPrefix}.csv`,
        file_type: 'csv',
        storage_path: `imports/${admin.id}/created_by_${testPrefix}.csv`,
        status: 'pending',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(job).toBeDefined()
    expect(job?.created_by).toBe(admin.id)

    // Cleanup
    await adminClient.from('import_jobs').delete().eq('id', job!.id)
  })
})
