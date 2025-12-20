/**
 * Import Commit Worker
 *
 * This API route handles the commit phase of an import.
 * It is called by QStash with automatic retries.
 *
 * Process:
 * 1. Verify QStash signature (or admin auth for direct calls)
 * 2. Build dedupe set from existing leads
 * 3. Read valid rows from import_rows in batches
 * 4. Check for duplicates
 * 5. Apply assignment logic
 * 6. Batch insert into leads table
 * 7. Create lead_history audit events
 * 8. Update import_rows with lead_id
 * 9. Mark job as completed
 */

import { createClient } from '@supabase/supabase-js';
import { createQStashHandler, type CommitJobPayload } from '@/modules/import/lib/queue';
import {
  buildDedupeSet,
  checkDuplicate,
  addToFileSet,
  findExistingLeadIds,
  type DedupeField,
} from '@/modules/import/lib/processors/dedupe';
import {
  buildAssignmentContext,
  getAssignment,
  createAssignmentStats,
  recordAssignment,
} from '@/modules/import/lib/processors/assignment';

// Vercel function configuration
export const maxDuration = 300; // 5 minutes max
export const dynamic = 'force-dynamic';

// Batch sizes
const FETCH_BATCH_SIZE = 500;
const INSERT_BATCH_SIZE = 100;

// Status label mapping
const STATUS_LABELS: Record<string, string> = {
  new: 'Nouveau',
  contacted: 'Contacté',
  qualified: 'Qualifié',
  proposal: 'Proposition envoyée',
  negotiation: 'Négociation',
  won: 'Gagné',
  lost: 'Perdu',
  no_answer_1: 'Pas de réponse 1',
  no_answer_2: 'Pas de réponse 2',
  wrong_number: 'Faux numéro',
  not_interested: 'Pas intéressé',
  callback: 'Rappeler',
  rdv: 'RDV',
  deposit: 'Dépôt',
  relance: 'Relance',
  mail: 'Mail',
};

/**
 * Create admin Supabase client
 */
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Main commit handler
 */
async function handleCommit(payload: CommitJobPayload): Promise<{
  success: boolean;
  importedCount: number;
  skippedCount: number;
  updatedCount: number;
  errorCount: number;
  processingTimeMs: number;
}> {
  const {
    importJobId,
    assignment,
    duplicates,
    defaultStatus = 'new',
    defaultSource,
  } = payload;

  const startTime = Date.now();
  console.log(`[Commit] Starting job ${importJobId}`);

  const supabase = createAdminClient();

  // Get the import job
  const { data: job, error: jobError } = await supabase
    .from('import_jobs')
    .select('*')
    .eq('id', importJobId)
    .single();

  if (jobError || !job) {
    throw new Error(`Job not found: ${importJobId}`);
  }

  if (job.status !== 'ready') {
    throw new Error(`Job is not ready for commit: ${job.status}`);
  }

  // Get the actor ID (job creator)
  const actorId = job.created_by;

  // Update status to importing
  await supabase
    .from('import_jobs')
    .update({
      status: 'importing',
      started_at: new Date().toISOString(),
      assignment_config: assignment,
      duplicate_config: duplicates,
    })
    .eq('id', importJobId);

  try {
    // Build dedupe set
    console.log('[Commit] Building dedupe set...');
    const databaseDedupeSet = await buildDedupeSet(supabase, {
      checkFields: duplicates.checkFields as DedupeField[],
      checkDatabase: duplicates.checkDatabase,
      checkWithinFile: false,
    });

    // File dedupe set (tracks duplicates within this import)
    const fileDedupeSet = new Set<string>();

    // Build assignment context
    const assignmentContext = await buildAssignmentContext(supabase, assignment);
    const assignmentStats = createAssignmentStats();

    // Counters
    let importedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    let offset = 0;

    // Process valid rows in batches
    while (true) {
      // Fetch batch of valid rows
      const { data: batch, error: batchError } = await supabase
        .from('import_rows')
        .select('*')
        .eq('import_job_id', importJobId)
        .eq('status', 'valid')
        .order('row_number', { ascending: true })
        .range(offset, offset + FETCH_BATCH_SIZE - 1);

      if (batchError) {
        throw new Error(`Failed to fetch rows: ${batchError.message}`);
      }

      if (!batch || batch.length === 0) {
        break;
      }

      console.log(`[Commit] Processing batch at offset ${offset}, ${batch.length} rows`);

      // Prepare leads for insert/update
      const leadsToInsert: Array<{
        data: Record<string, unknown>;
        rowId: string;
      }> = [];

      const leadsToUpdate: Array<{
        leadId: string;
        data: Record<string, unknown>;
        rowId: string;
      }> = [];

      const skippedRowIds: string[] = [];

      // Track duplicates that need lead ID lookup
      const duplicatesToLookup: Array<{ rowId: string; field: DedupeField; value: string }> = [];

      for (const row of batch) {
        const normalizedData = row.normalized_data as Record<string, string | null>;
        const rawData = row.raw_data as Record<string, string>;

        // Check for duplicates
        const dedupeResult = checkDuplicate(
          normalizedData,
          duplicates.checkFields as DedupeField[],
          databaseDedupeSet,
          duplicates.checkWithinFile ? fileDedupeSet : new Set()
        );

        if (dedupeResult.isDuplicate) {
          if (duplicates.strategy === 'skip') {
            skippedCount++;
            skippedRowIds.push(row.id);
            continue;
          } else if (duplicates.strategy === 'update') {
            // Queue for update - need to look up lead ID
            duplicatesToLookup.push({
              rowId: row.id,
              field: dedupeResult.duplicateField!,
              value: dedupeResult.duplicateValue!,
            });
            continue;
          }
          // strategy === 'create' falls through to insert
        }

        // Get assignment
        const assignedTo = getAssignment(assignmentContext, rawData);
        recordAssignment(assignmentStats, assignedTo);

        // Build lead data
        const leadData = buildLeadData(
          normalizedData,
          defaultStatus,
          defaultSource || job.file_name,
          assignedTo,
          importJobId
        );

        leadsToInsert.push({
          data: leadData,
          rowId: row.id,
        });

        // Add to file dedupe set
        if (duplicates.checkWithinFile) {
          addToFileSet(normalizedData, duplicates.checkFields as DedupeField[], fileDedupeSet);
        }
      }

      // Look up existing lead IDs for updates
      if (duplicatesToLookup.length > 0) {
        const leadIdMap = await findExistingLeadIds(
          supabase,
          duplicatesToLookup.map((d) => ({ field: d.field, value: d.value }))
        );

        for (const dup of duplicatesToLookup) {
          const key = `${dup.field}:${dup.value.toLowerCase().trim()}`;
          const leadId = leadIdMap.get(key);

          if (leadId) {
            const row = batch.find((r) => r.id === dup.rowId)!;
            const normalizedData = row.normalized_data as Record<string, string | null>;

            const updateData = buildLeadData(
              normalizedData,
              defaultStatus,
              defaultSource || job.file_name,
              null, // Don't change assignment on update
              importJobId
            );

            leadsToUpdate.push({
              leadId,
              data: updateData,
              rowId: dup.rowId,
            });
          } else {
            // Lead not found, skip
            skippedCount++;
            skippedRowIds.push(dup.rowId);
          }
        }
      }

      // Batch insert new leads
      if (leadsToInsert.length > 0) {
        for (let i = 0; i < leadsToInsert.length; i += INSERT_BATCH_SIZE) {
          const insertBatch = leadsToInsert.slice(i, i + INSERT_BATCH_SIZE);
          const leadsData = insertBatch.map((l) => l.data);

          const { data: insertedLeads, error: insertError } = await supabase
            .from('leads')
            .insert(leadsData)
            .select('id');

          if (insertError) {
            console.error('[Commit] Insert error:', insertError);
            errorCount += insertBatch.length;
            continue;
          }

          if (insertedLeads) {
            // Create history events
            const historyEvents = insertedLeads.map((lead, idx) => ({
              lead_id: lead.id,
              actor_id: actorId,
              event_type: 'imported',
              before_data: null,
              after_data: leadsData[idx],
              metadata: {
                import_job_id: importJobId,
                source: job.file_name,
              },
            }));

            await supabase.from('lead_history').insert(historyEvents);

            // Update import_rows with lead_id
            for (let j = 0; j < insertedLeads.length; j++) {
              await supabase
                .from('import_rows')
                .update({
                  status: 'imported',
                  lead_id: insertedLeads[j].id,
                })
                .eq('id', insertBatch[j].rowId);
            }

            importedCount += insertedLeads.length;

            // Add to database dedupe set
            for (let j = 0; j < insertedLeads.length; j++) {
              addToFileSet(
                leadsData[j] as Record<string, string | null>,
                duplicates.checkFields as DedupeField[],
                databaseDedupeSet
              );
            }
          }
        }
      }

      // Batch update existing leads
      for (const update of leadsToUpdate) {
        const { error: updateError } = await supabase
          .from('leads')
          .update(update.data)
          .eq('id', update.leadId);

        if (!updateError) {
          // Create history event
          await supabase.from('lead_history').insert({
            lead_id: update.leadId,
            actor_id: actorId,
            event_type: 'updated',
            before_data: null,
            after_data: update.data,
            metadata: {
              import_job_id: importJobId,
              action: 'update_existing',
            },
          });

          await supabase
            .from('import_rows')
            .update({
              status: 'imported',
              lead_id: update.leadId,
            })
            .eq('id', update.rowId);

          updatedCount++;
        } else {
          errorCount++;
        }
      }

      // Update skipped rows
      if (skippedRowIds.length > 0) {
        for (let i = 0; i < skippedRowIds.length; i += 100) {
          const chunk = skippedRowIds.slice(i, i + 100);
          await supabase
            .from('import_rows')
            .update({ status: 'skipped' })
            .in('id', chunk);
        }
      }

      // Update progress
      await supabase
        .from('import_jobs')
        .update({
          imported_rows: importedCount + updatedCount,
          skipped_rows: skippedCount,
        })
        .eq('id', importJobId);

      console.log(
        `[Commit] Batch complete: ${importedCount} imported, ${updatedCount} updated, ${skippedCount} skipped`
      );

      offset += batch.length;

      // Check if we've processed all rows
      if (batch.length < FETCH_BATCH_SIZE) {
        break;
      }
    }

    // Mark job as completed
    await supabase
      .from('import_jobs')
      .update({
        status: 'completed',
        imported_rows: importedCount + updatedCount,
        skipped_rows: skippedCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', importJobId);

    const processingTimeMs = Date.now() - startTime;

    console.log(
      `[Commit] Complete: ${importedCount} imported, ${updatedCount} updated, ${skippedCount} skipped, ${errorCount} errors, ${processingTimeMs}ms`
    );

    return {
      success: true,
      importedCount,
      skippedCount,
      updatedCount,
      errorCount,
      processingTimeMs,
    };

  } catch (error) {
    console.error(`[Commit] Job ${importJobId} failed:`, error);

    await supabase
      .from('import_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', importJobId);

    throw error;
  }
}

/**
 * Build lead data from normalized row
 */
function buildLeadData(
  data: Record<string, string | null>,
  defaultStatus: string,
  defaultSource: string,
  assignedTo: string | null,
  importJobId: string
): Record<string, unknown> {
  const status = data.status || defaultStatus;
  const statusLabel = STATUS_LABELS[status] || status;

  return {
    external_id: data.external_id || null,
    first_name: data.first_name || null,
    last_name: data.last_name || null,
    email: data.email || null,
    phone: data.phone || null,
    company: data.company || null,
    job_title: data.job_title || null,
    address: data.address || null,
    city: data.city || null,
    postal_code: data.postal_code || null,
    country: data.country || 'France',
    status,
    status_label: statusLabel,
    source: data.source || defaultSource,
    notes: data.notes || null,
    assigned_to: assignedTo,
    import_job_id: importJobId,
  };
}

/**
 * POST handler - called by QStash
 */
export const POST = createQStashHandler<CommitJobPayload>(handleCommit);

/**
 * GET handler - for health checks
 */
export async function GET() {
  return Response.json({
    status: 'ok',
    worker: 'import-commit',
    maxDuration,
  });
}
