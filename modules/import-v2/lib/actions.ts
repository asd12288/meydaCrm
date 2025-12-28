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
  /** Storage path (from uploadImportFileV2) */
  storagePath?: string;
  /** File hash (from uploadImportFileV2) */
  fileHash?: string;
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
    // Use provided storage path, or 'client-parsed' as fallback for legacy behavior
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        file_name: input.fileName,
        file_type: input.fileType,
        storage_path: input.storagePath || 'client-parsed',
        file_hash: input.fileHash || null,
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

// =============================================================================
// FILE UPLOAD & HISTORY ACTIONS
// =============================================================================

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ImportJobWithStatsV2, ImportActionResultV2 } from '../types';

/**
 * Upload a file to Supabase Storage
 * Returns storage path and file hash for the import job
 */
export async function uploadImportFileV2(
  formData: FormData
): Promise<ImportActionResultV2<{ storagePath: string; fileHash: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Non authentifie' };
    }

    if (user.profile?.role !== ROLES.ADMIN) {
      return { success: false, error: 'Acces refuse' };
    }

    const supabase = await createClient();

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'Aucun fichier fourni' };
    }

    // Validate file type
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      return { success: false, error: 'Format de fichier non supporte' };
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      return { success: false, error: 'Fichier trop volumineux (max 100 MB)' };
    }

    // Calculate file hash for idempotency
    const fileBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const fileHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Generate unique storage path
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `imports/${user.id}/${timestamp}_${sanitizedName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('imports')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return {
        success: false,
        error: `Erreur lors du telechargement: ${uploadError.message}`,
      };
    }

    return {
      success: true,
      data: { storagePath, fileHash },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Get paginated import jobs for history display
 */
export async function getPaginatedImportJobsV2(
  page: number = 1,
  pageSize: number = 10
): Promise<ImportActionResultV2<{ jobs: ImportJobWithStatsV2[]; total: number; totalPages: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Non authentifie' };
    }

    if (user.profile?.role !== ROLES.ADMIN) {
      return { success: false, error: 'Acces refuse' };
    }

    const supabase = await createClient();

    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from('import_jobs')
      .select('*, creator:profiles!import_jobs_created_by_fkey(id, display_name)', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      return { success: false, error: error.message };
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data: {
        jobs: data as ImportJobWithStatsV2[],
        total,
        totalPages,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Get a signed URL to download the original import file
 */
export async function downloadImportFileV2(
  importJobId: string
): Promise<ImportActionResultV2<{ url: string; fileName: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Non authentifie' };
    }

    if (user.profile?.role !== ROLES.ADMIN) {
      return { success: false, error: 'Acces refuse' };
    }

    const supabase = await createClient();

    // Get the job to find storage path and file name
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('storage_path, file_name')
      .eq('id', importJobId)
      .single();

    if (jobError || !job) {
      return { success: false, error: 'Job non trouve' };
    }

    // Check if file is available (not client-parsed legacy)
    if (!job.storage_path || job.storage_path === 'client-parsed') {
      return { success: false, error: 'Fichier non disponible' };
    }

    // Create a signed URL (valid for 1 hour)
    const { data: signedUrl, error: signError } = await supabase.storage
      .from('imports')
      .createSignedUrl(job.storage_path, 3600);

    if (signError || !signedUrl) {
      return { success: false, error: 'Impossible de generer le lien de telechargement' };
    }

    return {
      success: true,
      data: {
        url: signedUrl.signedUrl,
        fileName: job.file_name,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Delete an import job and its associated file
 */
export async function deleteImportJobV2(
  importJobId: string
): Promise<ImportActionResultV2<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Non authentifie' };
    }

    if (user.profile?.role !== ROLES.ADMIN) {
      return { success: false, error: 'Acces refuse' };
    }

    const supabase = await createClient();

    // Get the job to find storage path and status
    const { data: job } = await supabase
      .from('import_jobs')
      .select('storage_path, status')
      .eq('id', importJobId)
      .single();

    if (!job) {
      return { success: false, error: 'Job non trouve' };
    }

    // Don't allow deletion of active imports
    if (['parsing', 'importing'].includes(job.status)) {
      return { success: false, error: 'Impossible de supprimer un import en cours' };
    }

    // Delete from storage if file exists
    if (job.storage_path && job.storage_path !== 'client-parsed') {
      await supabase.storage.from('imports').remove([job.storage_path]);
    }

    // Delete job (cascade will delete import_rows)
    const { error } = await supabase
      .from('import_jobs')
      .delete()
      .eq('id', importJobId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/import-v2');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
