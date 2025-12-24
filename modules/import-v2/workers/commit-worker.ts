/**
 * Import V2 Commit Worker
 *
 * Enhanced commit logic with per-row duplicate actions
 * and full transparency results tracking.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  ImportResultsSummaryV2,
  ImportRowResultV2,
  AssignmentConfigV2,
  DuplicateConfigV2,
} from '../types';

/**
 * Internal commit worker action type
 * 'skip' = don't import
 * 'update' = update existing lead
 * 'create' = create new lead (even if duplicate)
 */
type CommitRowAction = 'skip' | 'update' | 'create';
import type { DbDuplicateInfoV2 } from '../lib/actions';
import type { DuplicateCheckField, RowResultStatus } from '../config/constants';
import { PROCESSING } from '../config/constants';

// =============================================================================
// CONSTANTS
// =============================================================================

const LOG_PREFIX = '[CommitWorkerV2]';
const FETCH_BATCH_SIZE = PROCESSING.COMMIT_BATCH_SIZE * 10; // 1000
const INSERT_BATCH_SIZE = PROCESSING.COMMIT_BATCH_SIZE; // 100

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

// =============================================================================
// TYPES
// =============================================================================

export interface CommitOptionsV2 {
  importJobId: string;
  assignment: AssignmentConfigV2;
  duplicates: DuplicateConfigV2;
  defaultStatus?: string;
  defaultSource?: string;
  /** Per-row actions for DB duplicates (rowNumber -> action) */
  rowActions: Map<number, CommitRowAction>;
  /** DB duplicate info (rowNumber -> duplicate details) */
  dbDuplicateInfo?: Map<number, DbDuplicateInfoV2>;
  /** Progress callback for real-time updates */
  onProgress?: (progress: CommitProgress) => void;
}

export interface CommitProgress {
  phase: 'preparing' | 'checking_duplicates' | 'importing' | 'finalizing';
  processedRows: number;
  totalRows: number;
  currentBatch: number;
  totalBatches: number;
  counters: {
    imported: number;
    updated: number;
    skipped: number;
    errors: number;
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function createAdminClient(): SupabaseClient {
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

function normalizeStatus(rawStatus: string | null, fallback: string): string {
  if (!rawStatus) return fallback;

  const normalized = rawStatus.trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');

  const aliases: Record<string, string> = {
    not_interess: 'not_interested',
    not_interested: 'not_interested',
    not_interesse: 'not_interested',
    non_interesse: 'not_interested',
    'non_intéressé': 'not_interested',
    'not_interessé': 'not_interested',
    'not_interessée': 'not_interested',
    pas_interesse: 'not_interested',
    'pas_intéressé': 'not_interested',
    'pas_interessé': 'not_interested',
    uninterested: 'not_interested',
    no_answer: 'no_answer_1',
    no_answer1: 'no_answer_1',
    not_answered: 'no_answer_1',
  };

  const mapped = aliases[normalized] || normalized;
  const allowed = new Set(Object.keys(STATUS_LABELS));

  return allowed.has(mapped) ? mapped : fallback;
}

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

function createRowResult(
  rowNumber: number,
  status: RowResultStatus,
  data: Record<string, string | null>,
  options?: {
    leadId?: string;
    reason?: string;
    changedFields?: string[];
    duplicateInfo?: {
      matchedField: DuplicateCheckField;
      matchedValue: string;
      existingLeadId: string;
    };
  }
): ImportRowResultV2 {
  return {
    rowNumber,
    status,
    leadId: options?.leadId,
    reason: options?.reason,
    displayData: {
      email: data.email,
      phone: data.phone,
      firstName: data.first_name,
      lastName: data.last_name,
      company: data.company,
    },
    changedFields: options?.changedFields as ImportRowResultV2['changedFields'],
    duplicateInfo: options?.duplicateInfo,
  };
}

// =============================================================================
// MAIN COMMIT HANDLER
// =============================================================================

export async function handleCommitV2(
  options: CommitOptionsV2
): Promise<ImportResultsSummaryV2> {
  const startTime = Date.now();
  console.log(LOG_PREFIX, 'handleCommitV2 START', {
    importJobId: options.importJobId,
    assignmentMode: options.assignment.mode,
    duplicateStrategy: options.duplicates.strategy,
    rowActionsCount: options.rowActions.size,
  });

  const supabase = createAdminClient();
  const { importJobId, defaultStatus = 'new', rowActions, onProgress } = options;

  // Results tracking
  const importedRows: ImportRowResultV2[] = [];
  const updatedRows: ImportRowResultV2[] = [];
  const skippedRows: ImportRowResultV2[] = [];
  const errorRows: ImportRowResultV2[] = [];

  // Get the import job
  console.log(LOG_PREFIX, 'Fetching import job...');
  const { data: job, error: jobError } = await supabase
    .from('import_jobs')
    .select('*')
    .eq('id', importJobId)
    .single();

  if (jobError || !job) {
    console.error(LOG_PREFIX, 'Job not found:', importJobId, jobError);
    throw new Error(`Job not found: ${importJobId}`);
  }

  const actorId = job.created_by;
  const defaultSource = options.defaultSource || job.file_name;

  // Validate job status
  if (!['ready', 'queued', 'importing'].includes(job.status)) {
    console.error(LOG_PREFIX, 'Job not ready for commit:', job.status);
    throw new Error(`Job is not ready for commit: ${job.status}`);
  }

  // Update job status
  await supabase
    .from('import_jobs')
    .update({
      status: 'importing',
      started_at: new Date().toISOString(),
      worker_id: 'v2-direct-worker',
    })
    .eq('id', importJobId);

  try {
    // Get total count for progress
    const { count: totalCount } = await supabase
      .from('import_rows')
      .select('*', { count: 'exact', head: true })
      .eq('import_job_id', importJobId)
      .eq('status', 'valid');

    const totalRows = totalCount || 0;
    const totalBatches = Math.ceil(totalRows / FETCH_BATCH_SIZE);

    console.log(LOG_PREFIX, `Processing ${totalRows} valid rows in ${totalBatches} batches`);

    // Build assignment context
    const assignmentContext = await buildAssignmentContext(supabase, options.assignment);

    // Process rows in batches
    let offset = 0;
    let batchNumber = 0;

    while (true) {
      batchNumber++;

      // Report progress
      onProgress?.({
        phase: 'importing',
        processedRows: offset,
        totalRows,
        currentBatch: batchNumber,
        totalBatches,
        counters: {
          imported: importedRows.length,
          updated: updatedRows.length,
          skipped: skippedRows.length,
          errors: errorRows.length,
        },
      });

      // Fetch batch
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
        console.log(LOG_PREFIX, 'No more rows to process');
        break;
      }

      console.log(LOG_PREFIX, `Batch ${batchNumber}: ${batch.length} rows`);

      // Process each row
      for (const row of batch) {
        const normalizedData = row.normalized_data as Record<string, string | null>;
        const rowNumber = row.row_number as number;

        // Check if this is a DB duplicate with per-row action
        const rowAction = rowActions.get(rowNumber);
        const dupInfo = options.dbDuplicateInfo?.get(rowNumber);
        const isDbDuplicate = rowAction !== undefined || dupInfo !== undefined;

        // Get DB duplicate info from the passed map
        const duplicateField = dupInfo?.matchedField || null;
        const duplicateValue = dupInfo?.matchedValue || null;
        const existingLeadId = dupInfo?.existingLeadId || null;

        // Determine action
        let action: CommitRowAction;
        if (isDbDuplicate && rowAction) {
          action = rowAction;
        } else if (isDbDuplicate) {
          // DuplicateStrategyV2 already uses 'skip' | 'update' | 'create'
          action = options.duplicates.strategy;
        } else {
          action = 'create'; // New rows are always created
        }

        // Execute action
        try {
          if (action === 'skip') {
            // Skip this row
            const result = createRowResult(rowNumber, 'skipped', normalizedData, {
              reason: 'Doublon ignoré par choix utilisateur',
              duplicateInfo: duplicateField && duplicateValue && existingLeadId
                ? {
                    matchedField: duplicateField,
                    matchedValue: duplicateValue,
                    existingLeadId,
                  }
                : undefined,
            });
            skippedRows.push(result);

            await supabase
              .from('import_rows')
              .update({ status: 'skipped' })
              .eq('id', row.id);

          } else if (action === 'update' && existingLeadId) {
            // Update existing lead
            const updateData = buildLeadData(
              normalizedData,
              defaultStatus,
              defaultSource,
              null, // Don't change assignment on update
              importJobId
            );

            const { error: updateError } = await supabase
              .from('leads')
              .update(updateData)
              .eq('id', existingLeadId);

            if (updateError) {
              const result = createRowResult(rowNumber, 'error', normalizedData, {
                reason: `Erreur de mise à jour: ${updateError.message}`,
              });
              errorRows.push(result);
            } else {
              // Create history event
              await supabase.from('lead_history').insert({
                lead_id: existingLeadId,
                actor_id: actorId,
                event_type: 'updated',
                before_data: null,
                after_data: updateData,
                metadata: {
                  import_job_id: importJobId,
                  action: 'import_update',
                },
              });

              const result = createRowResult(rowNumber, 'updated', normalizedData, {
                leadId: existingLeadId,
                duplicateInfo: duplicateField && duplicateValue
                  ? {
                      matchedField: duplicateField,
                      matchedValue: duplicateValue,
                      existingLeadId,
                    }
                  : undefined,
              });
              updatedRows.push(result);

              await supabase
                .from('import_rows')
                .update({ status: 'imported' })
                .eq('id', row.id);
            }

          } else {
            // Create new lead
            const assignedTo = getAssignment(assignmentContext, normalizedData);
            const leadData = buildLeadData(
              normalizedData,
              defaultStatus,
              defaultSource,
              assignedTo,
              importJobId
            );

            const { data: insertedLead, error: insertError } = await supabase
              .from('leads')
              .insert(leadData)
              .select('id')
              .single();

            if (insertError || !insertedLead) {
              const result = createRowResult(rowNumber, 'error', normalizedData, {
                reason: `Erreur d'insertion: ${insertError?.message || 'Unknown error'}`,
              });
              errorRows.push(result);
            } else {
              // Create history event
              await supabase.from('lead_history').insert({
                lead_id: insertedLead.id,
                actor_id: actorId,
                event_type: 'imported',
                before_data: null,
                after_data: leadData,
                metadata: {
                  import_job_id: importJobId,
                  source: defaultSource,
                },
              });

              const result = createRowResult(rowNumber, 'imported', normalizedData, {
                leadId: insertedLead.id,
              });
              importedRows.push(result);

              await supabase
                .from('import_rows')
                .update({ status: 'imported' })
                .eq('id', row.id);
            }
          }
        } catch (error) {
          const result = createRowResult(rowNumber, 'error', normalizedData, {
            reason: error instanceof Error ? error.message : 'Erreur inconnue',
          });
          errorRows.push(result);
        }
      }

      // Update progress in job
      await supabase
        .from('import_jobs')
        .update({
          imported_rows: importedRows.length + updatedRows.length,
          skipped_rows: skippedRows.length,
        })
        .eq('id', importJobId);

      offset += batch.length;

      if (batch.length < FETCH_BATCH_SIZE) {
        break;
      }
    }

    // Mark job as completed
    console.log(LOG_PREFIX, 'Marking job as completed');
    await supabase
      .from('import_jobs')
      .update({
        status: 'completed',
        imported_rows: importedRows.length + updatedRows.length,
        skipped_rows: skippedRows.length,
        completed_at: new Date().toISOString(),
      })
      .eq('id', importJobId);

    const durationMs = Date.now() - startTime;

    // Final progress report
    onProgress?.({
      phase: 'finalizing',
      processedRows: totalRows,
      totalRows,
      currentBatch: totalBatches,
      totalBatches,
      counters: {
        imported: importedRows.length,
        updated: updatedRows.length,
        skipped: skippedRows.length,
        errors: errorRows.length,
      },
    });

    const results: ImportResultsSummaryV2 = {
      totalRows,
      importedCount: importedRows.length,
      updatedCount: updatedRows.length,
      skippedCount: skippedRows.length,
      errorCount: errorRows.length,
      durationMs,
      importedRows,
      updatedRows,
      skippedRows,
      errorRows,
    };

    console.log(LOG_PREFIX, 'handleCommitV2 COMPLETE', {
      imported: results.importedCount,
      updated: results.updatedCount,
      skipped: results.skippedCount,
      errors: results.errorCount,
      durationMs,
    });

    return results;

  } catch (error) {
    console.error(LOG_PREFIX, 'handleCommitV2 ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await supabase
      .from('import_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', importJobId);

    throw error;
  }
}

// =============================================================================
// ASSIGNMENT HELPERS
// =============================================================================

interface AssignmentContext {
  mode: 'none' | 'round_robin' | 'by_column';
  userIds: string[];
  currentIndex: number;
  columnName?: string;
  userLookup: Map<string, string>;
}

async function buildAssignmentContext(
  supabase: SupabaseClient,
  config: AssignmentConfigV2
): Promise<AssignmentContext> {
  const context: AssignmentContext = {
    mode: config.mode,
    userIds: config.selectedUserIds,
    currentIndex: 0,
    columnName: config.assignmentColumn,
    userLookup: new Map(),
  };

  if (config.mode === 'by_column') {
    // Build lookup by display name
    const { data: users } = await supabase
      .from('profiles')
      .select('id, display_name');

    if (users) {
      for (const user of users) {
        if (user.display_name) {
          context.userLookup.set(user.display_name.toLowerCase(), user.id);
        }
      }
    }
  }

  return context;
}

function getAssignment(
  context: AssignmentContext,
  rowData: Record<string, string | null>
): string | null {
  if (context.mode === 'none') {
    return null;
  }

  if (context.mode === 'round_robin') {
    if (context.userIds.length === 0) return null;
    const userId = context.userIds[context.currentIndex % context.userIds.length];
    context.currentIndex++;
    return userId;
  }

  if (context.mode === 'by_column' && context.columnName) {
    const value = rowData[context.columnName];
    if (value) {
      return context.userLookup.get(value.toLowerCase()) || null;
    }
  }

  return null;
}
