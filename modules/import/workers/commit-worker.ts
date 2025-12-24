/**
 * Commit Worker - Core Logic
 * 
 * Can be called directly from server actions (local dev)
 * or via API route from QStash (production)
 */

import { createClient } from '@supabase/supabase-js';
import {
  buildDedupeSet,
  checkDuplicate,
  addToFileSet,
  findExistingLeadIds,
  type DedupeField,
} from '../lib/processors/dedupe';
import {
  buildAssignmentContext,
  getAssignment,
} from '../lib/processors/assignment';
import type { AssignmentConfig, DuplicateConfig } from '../types';
import { notifyImportCompleted, notifyImportFailed } from '@/modules/notifications';

const FETCH_BATCH_SIZE = 1000;
const INSERT_BATCH_SIZE = 500;

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
 * Normalize incoming status to allowed enum values
 */
function normalizeStatus(rawStatus: string | null, fallback: string): string {
  if (!rawStatus) return fallback;

  const normalized = rawStatus.trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');

  const aliases: Record<string, string> = {
    not_interess: 'not_interested',
    not_interested: 'not_interested',
    not_interesse: 'not_interested',
    non_interesse: 'not_interested',
    non_intéressé: 'not_interested',
    not_interessé: 'not_interested',
    not_interessée: 'not_interested',
    pas_interesse: 'not_interested',
    pas_intéressé: 'not_interested',
    pas_interessé: 'not_interested',
    uninterested: 'not_interested',
    no_answer: 'no_answer_1',
    no_answer1: 'no_answer_1',
    not_answered: 'no_answer_1',
  };

  const mapped = aliases[normalized] || normalized;
  const allowed = new Set(Object.keys(STATUS_LABELS));

  if (allowed.has(mapped)) return mapped;

  return fallback;
}

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
 * Build lead data from normalized row
 */
function buildLeadData(
  data: Record<string, string | null>,
  defaultStatus: string,
  defaultSource: string,
  assignedTo: string | null,
  importJobId: string
): Record<string, unknown> {
  const status = normalizeStatus(data.status, defaultStatus);
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
 * Main commit handler - can be called directly or from API route
 */
export async function handleCommitDirectly(
  importJobId: string,
  assignment: AssignmentConfig,
  duplicates: DuplicateConfig,
  defaultStatus: string = 'new',
  defaultSource?: string
): Promise<{
  success: boolean;
  importedCount: number;
  skippedCount: number;
  updatedCount: number;
  errorCount: number;
  processingTimeMs: number;
}> {
  const startTime = Date.now();
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

  // Allow 'ready', 'queued', or 'importing' (importing is set by parse-worker before calling commit)
  if (!['ready', 'queued', 'importing'].includes(job.status)) {
    throw new Error(`Job is not ready for commit: ${job.status}`);
  }

  const actorId = job.created_by;

  // Update status to importing
  await supabase
    .from('import_jobs')
    .update({
      status: 'importing',
      started_at: new Date().toISOString(),
      assignment_config: assignment,
      duplicate_config: duplicates,
      worker_id: 'direct-worker',
    })
    .eq('id', importJobId);

  try {
    // Build dedupe set
    const databaseDedupeSet = await buildDedupeSet(supabase, {
      checkFields: duplicates.checkFields as DedupeField[],
      checkDatabase: duplicates.checkDatabase,
      checkWithinFile: false,
    });

    const fileDedupeSet = new Set<string>();
    const assignmentContext = await buildAssignmentContext(supabase, assignment);

    let importedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    let offset = 0;

    // Process valid rows in batches
    while (true) {
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

      const leadsToInsert: Array<{ data: Record<string, unknown>; rowId: string }> = [];
      const leadsToUpdate: Array<{ leadId: string; data: Record<string, unknown>; rowId: string }> = [];
      const skippedRowIds: string[] = [];
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
            duplicatesToLookup.push({
              rowId: row.id,
              field: dedupeResult.duplicateField!,
              value: dedupeResult.duplicateValue!,
            });
            continue;
          }
        }

        // Get assignment
        const assignedTo = getAssignment(assignmentContext, rawData);

        // Build lead data
        const leadData = buildLeadData(
          normalizedData,
          defaultStatus,
          defaultSource || job.file_name,
          assignedTo,
          importJobId
        );

        leadsToInsert.push({ data: leadData, rowId: row.id });

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
              null,
              importJobId
            );

            leadsToUpdate.push({
              leadId,
              data: updateData,
              rowId: dup.rowId,
            });
          } else {
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
            errorCount += insertBatch.length;
            continue;
          }

          if (insertedLeads) {
            // Create history events in batch
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

            // Batch update import_rows status (much faster than one-by-one)
            const rowIds = insertBatch.map((item) => item.rowId);
            await supabase
              .from('import_rows')
              .update({ status: 'imported' })
              .in('id', rowIds);

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
      if (leadsToUpdate.length > 0) {
        const updatedRowIds: string[] = [];
        const historyEventsForUpdates: Array<{
          lead_id: string;
          actor_id: string;
          event_type: string;
          before_data: null;
          after_data: Record<string, unknown>;
          metadata: { import_job_id: string; action: string };
        }> = [];

        for (const update of leadsToUpdate) {
          const { error: updateError } = await supabase
            .from('leads')
            .update(update.data)
            .eq('id', update.leadId);

          if (!updateError) {
            historyEventsForUpdates.push({
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
            updatedRowIds.push(update.rowId);
            updatedCount++;
          } else {
            errorCount++;
          }
        }

        // Batch insert history events
        if (historyEventsForUpdates.length > 0) {
          await supabase.from('lead_history').insert(historyEventsForUpdates);
        }

        // Batch update import_rows status
        if (updatedRowIds.length > 0) {
          await supabase
            .from('import_rows')
            .update({ status: 'imported' })
            .in('id', updatedRowIds);
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

      offset += batch.length;

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

    // Send notification to import creator
    if (actorId) {
      await notifyImportCompleted(
        actorId,
        importJobId,
        job.file_name || undefined,
        importedCount + updatedCount
      );
    }

    return {
      success: true,
      importedCount,
      skippedCount,
      updatedCount,
      errorCount,
      processingTimeMs,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await supabase
      .from('import_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', importJobId);

    // Send notification to import creator
    if (job?.created_by) {
      await notifyImportFailed(
        job.created_by,
        importJobId,
        job.file_name || undefined,
        errorMessage
      );
    }

    throw error;
  }
}
