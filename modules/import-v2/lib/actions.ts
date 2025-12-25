/**
 * Import V2 Server Actions
 *
 * Server actions for the import wizard
 */

'use server';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/modules/auth';
import { handleCommitV2 } from '../workers';
import { ROLES } from '@/lib/constants';
import type {
  ColumnMappingV2,
  AssignmentConfigV2,
  DuplicateConfigV2,
  ImportResultsSummaryV2,
  RowDuplicateAction,
} from '../types';
import type { LeadFieldKey } from '@/modules/import/types/mapping';
import type { DuplicateCheckField } from '../config/constants';

// =============================================================================
// TYPES
// =============================================================================

/**
 * DB duplicate info for a row (passed from client)
 */
export interface DbDuplicateInfoV2 {
  /** Row number */
  rowNumber: number;
  /** Field that matched */
  matchedField: DuplicateCheckField;
  /** Value that matched */
  matchedValue: string;
  /** Existing lead ID */
  existingLeadId: string;
}

interface StartImportV2Input {
  /** File name */
  fileName: string;
  /** File type */
  fileType: 'csv' | 'xlsx' | 'xls';
  /** Total row count */
  totalRows: number;
  /** Validated rows with normalized data */
  validatedRows: Array<{
    rowNumber: number;
    isValid: boolean;
    normalizedData: Partial<Record<LeadFieldKey, string | null>>;
    isFileDuplicate?: boolean;
  }>;
  /** Column mappings */
  mappings: ColumnMappingV2[];
  /** Assignment configuration */
  assignment: AssignmentConfigV2;
  /** Duplicate configuration */
  duplicates: DuplicateConfigV2;
  /** Per-row actions for DB duplicates */
  rowActions: Array<[number, RowDuplicateAction]>;
  /** DB duplicate info (row number -> duplicate details) */
  dbDuplicateInfo?: DbDuplicateInfoV2[];
  /** Default status */
  defaultStatus?: string;
  /** Default source */
  defaultSource?: string;
}

interface StartImportV2Result {
  success: boolean;
  error?: string;
  importJobId?: string;
  results?: ImportResultsSummaryV2;
}

// =============================================================================
// SERVER ACTIONS
// =============================================================================

/**
 * Start import V2 - creates job, writes rows, and runs commit
 */
export async function startImportV2(
  input: StartImportV2Input
): Promise<StartImportV2Result> {
  try {
    // Check auth
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Non authentifie' };
    }

    if (user.profile?.role !== ROLES.ADMIN) {
      return { success: false, error: 'Acces refuse' };
    }

    const supabase = createServiceRoleClient();

    // 1. Create import_job
    // Note: storage_path is 'client-parsed' since V2 parses on client, not server
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        file_name: input.fileName,
        file_type: input.fileType,
        storage_path: 'client-parsed', // V2 doesn't use storage - parsed on client
        total_rows: input.totalRows,
        status: 'ready',
        created_by: user.id,
        column_mapping: {
          mappings: input.mappings,
          version: 2,
        },
        assignment_config: input.assignment,
        duplicate_config: input.duplicates,
      })
      .select('id')
      .single();

    if (jobError || !job) {
      return { success: false, error: 'Erreur lors de la creation du job' };
    }

    const importJobId = job.id;

    // 2. Write validated rows to import_rows (only valid, non-file-duplicate)
    const rowsToInsert = input.validatedRows
      .filter((r) => r.isValid && !r.isFileDuplicate)
      .map((row) => ({
        import_job_id: importJobId,
        row_number: row.rowNumber,
        chunk_number: 1, // V2 uses single chunk since parsing is client-side
        status: 'valid',
        raw_data: row.normalizedData, // V2: use normalized as raw since we parsed on client
        normalized_data: row.normalizedData,
      }));

    if (rowsToInsert.length > 0) {
      // Insert in batches of 500
      const BATCH_SIZE = 500;
      for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
        const batch = rowsToInsert.slice(i, i + BATCH_SIZE);
        const { error: insertError } = await supabase
          .from('import_rows')
          .insert(batch);

        if (insertError) {
          // Mark job as failed
          await supabase
            .from('import_jobs')
            .update({ status: 'failed', error_message: insertError.message })
            .eq('id', importJobId);
          return { success: false, error: 'Erreur lors de l\'insertion des lignes' };
        }
      }
    }

    // Update job with valid row count
    await supabase
      .from('import_jobs')
      .update({ valid_rows: rowsToInsert.length })
      .eq('id', importJobId);

    // 3. Run commit worker directly

    // Build set of valid row numbers for validation
    const validRowNumbers = new Set(
      input.validatedRows
        .filter((r) => r.isValid && !r.isFileDuplicate)
        .map((r) => r.rowNumber)
    );
    const validActions = new Set(['skip', 'import', 'update']);

    // Map UnifiedRowAction 'import' -> 'create' for commit worker (with validation)
    const rowActionsMap = new Map<number, 'skip' | 'update' | 'create'>();
    for (const [rowNumber, action] of input.rowActions) {
      // Validate row number exists
      if (!validRowNumbers.has(rowNumber)) {
        continue;
      }
      // Validate action type
      if (!validActions.has(action)) {
        continue;
      }
      // 'import' in UI means 'create' for the worker (force create as new lead)
      rowActionsMap.set(rowNumber, action === 'import' ? 'create' : action);
    }

    // Build DB duplicate info map (with validation)
    const dbDuplicateInfoMap = new Map<number, DbDuplicateInfoV2>();
    if (input.dbDuplicateInfo) {
      for (const info of input.dbDuplicateInfo) {
        // Validate row number exists
        if (!validRowNumbers.has(info.rowNumber)) {
          continue;
        }
        // Validate existingLeadId is UUID-like (basic check)
        if (!info.existingLeadId || typeof info.existingLeadId !== 'string' || info.existingLeadId.length < 32) {
          continue;
        }
        dbDuplicateInfoMap.set(info.rowNumber, info);
      }
    }

    const results = await handleCommitV2({
      importJobId,
      assignment: input.assignment,
      duplicates: input.duplicates,
      defaultStatus: input.defaultStatus || 'new',
      defaultSource: input.defaultSource || input.fileName,
      rowActions: rowActionsMap,
      dbDuplicateInfo: dbDuplicateInfoMap,
    });

    return {
      success: true,
      importJobId,
      results,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Get import job status (for polling)
 */
export async function getImportJobStatus(
  jobId: string
): Promise<{
  status: string;
  importedRows?: number;
  skippedRows?: number;
  errorMessage?: string;
} | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const supabase = createServiceRoleClient();

    const { data: job } = await supabase
      .from('import_jobs')
      .select('status, imported_rows, skipped_rows, error_message')
      .eq('id', jobId)
      .single();

    if (!job) return null;

    return {
      status: job.status,
      importedRows: job.imported_rows,
      skippedRows: job.skipped_rows,
      errorMessage: job.error_message,
    };
  } catch {
    return null;
  }
}
