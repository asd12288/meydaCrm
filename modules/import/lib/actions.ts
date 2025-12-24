'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/modules/auth';
import { enqueueParseJob, enqueueCommitJob } from './queue';
import type {
  ImportActionResult,
  ImportJobWithStats,
  ImportRowWithDetails,
  ColumnMappingConfig,
  AssignmentConfig,
  DuplicateConfig,
} from '../types';

// =============================================================================
// FILE UPLOAD
// =============================================================================

/**
 * Upload a file to Supabase Storage and create an import job record
 */
export async function uploadImportFile(
  formData: FormData
): Promise<ImportActionResult<{ importJobId: string; storagePath: string; isDuplicate?: boolean }>> {
  try {
    const user = await requireAdmin();
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

    // Validate file size (100MB max for large imports)
    if (file.size > 100 * 1024 * 1024) {
      return { success: false, error: 'Fichier trop volumineux (max 100 MB)' };
    }

    // Calculate file hash for idempotency check
    const fileBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const fileHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
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

    // Create import job record with file hash
    const { data: importJob, error: dbError } = await supabase
      .from('import_jobs')
      .insert({
        created_by: user.id,
        file_name: file.name,
        file_type: ext,
        storage_path: storagePath,
        file_hash: fileHash,
        status: 'pending',
      })
      .select('id')
      .single();

    if (dbError) {
      // Clean up uploaded file if DB insert fails
      await supabase.storage.from('imports').remove([storagePath]);
      return {
        success: false,
        error: `Erreur lors de la creation du job: ${dbError.message}`,
      };
    }

    return {
      success: true,
      data: {
        importJobId: importJob.id,
        storagePath,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

// =============================================================================
// IMPORT JOB MANAGEMENT
// =============================================================================

/**
 * Get import job details
 */
export async function getImportJob(
  importJobId: string
): Promise<ImportActionResult<ImportJobWithStats>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('import_jobs')
      .select('*, creator:profiles!import_jobs_created_by_fkey(id, display_name)')
      .eq('id', importJobId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ImportJobWithStats };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Get all import jobs for history
 */
export async function getImportJobs(): Promise<ImportActionResult<ImportJobWithStats[]>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('import_jobs')
      .select('*, creator:profiles!import_jobs_created_by_fkey(id, display_name)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ImportJobWithStats[] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Get recent import jobs for dashboard (with total count)
 */
export async function getRecentImportJobs(
  limit = 10
): Promise<ImportActionResult<{ jobs: ImportJobWithStats[]; total: number }>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Get jobs with count
    const { data, error, count } = await supabase
      .from('import_jobs')
      .select('*, creator:profiles!import_jobs_created_by_fkey(id, display_name)', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        jobs: data as ImportJobWithStats[],
        total: count || 0,
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
 * Get paginated import jobs
 */
export async function getPaginatedImportJobs(
  page: number = 1,
  pageSize: number = 10
): Promise<ImportActionResult<{ jobs: ImportJobWithStats[]; total: number; totalPages: number }>> {
  try {
    await requireAdmin();
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
        jobs: data as ImportJobWithStats[],
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
 * Update import job with column mapping configuration
 */
export async function updateImportJobMapping(
  importJobId: string,
  mapping: ColumnMappingConfig
): Promise<ImportActionResult<void>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from('import_jobs')
      .update({
        column_mapping: mapping as unknown as Record<string, unknown>,
        status: 'validating',
        updated_at: new Date().toISOString(),
      })
      .eq('id', importJobId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Update import job with assignment and duplicate options
 */
export async function updateImportJobOptions(
  importJobId: string,
  options: {
    assignmentConfig: AssignmentConfig;
    duplicateConfig: DuplicateConfig;
  }
): Promise<ImportActionResult<void>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from('import_jobs')
      .update({
        assignment_config: options.assignmentConfig as unknown as Record<string, unknown>,
        duplicate_config: options.duplicateConfig as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq('id', importJobId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

// =============================================================================
// QSTASH JOB QUEUE
// =============================================================================

/**
 * Start the import parsing process via QStash queue
 * The parse worker will:
 * 1. Download file from Supabase Storage
 * 2. Stream parse CSV/XLSX row by row
 * 3. Validate each row
 * 4. Insert into import_rows table in batches
 * 5. Update progress with checkpoints
 * 6. Mark job as ready when complete
 */
export async function startImportParsing(
  importJobId: string
): Promise<ImportActionResult<{ messageId: string }>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Verify job exists and is in pending/failed state
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('status')
      .eq('id', importJobId)
      .single();

    if (jobError || !job) {
      return { success: false, error: 'Job non trouvé' };
    }

    // Allow retrying from pending, failed, or stuck states
    if (!['pending', 'failed', 'validating', 'parsing'].includes(job.status)) {
      return { success: false, error: 'Ce job ne peut pas être relancé (statut: ' + job.status + ')' };
    }

    // Update status to queued
    await supabase
      .from('import_jobs')
      .update({ status: 'queued', error_message: null })
      .eq('id', importJobId);

    // Enqueue parse job via QStash
    const messageId = await enqueueParseJob({ importJobId });

    revalidatePath('/import');
    return { success: true, data: { messageId } };
  } catch (error) {

    // Try to update status to failed
    try {
      const supabase = await createClient();
      await supabase
        .from('import_jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Erreur lors de la mise en file',
        })
        .eq('id', importJobId);
    } catch {
      // Ignore secondary errors
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Start the import commit process via QStash queue
 * The commit worker will:
 * 1. Build dedupe set from existing leads (cursor pagination)
 * 2. Read validated rows from import_rows in batches
 * 3. Check for duplicates
 * 4. Apply assignment logic
 * 5. Batch insert into leads table
 * 6. Create lead_history audit events
 * 7. Update import_rows with lead_id
 * 8. Mark job as completed
 */
export async function startImportCommit(
  importJobId: string,
  config: {
    assignment: AssignmentConfig;
    duplicates: DuplicateConfig;
    defaultStatus?: string;
    defaultSource?: string;
  }
): Promise<ImportActionResult<{ messageId: string }>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Verify job exists and is in ready state
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('status, valid_rows')
      .eq('id', importJobId)
      .single();

    if (jobError || !job) {
      return { success: false, error: 'Job non trouvé' };
    }

    if (job.status !== 'ready') {
      return {
        success: false,
        error: `Le job n'est pas prêt pour l'import (status: ${job.status})`,
      };
    }

    if (!job.valid_rows || job.valid_rows === 0) {
      return { success: false, error: 'Aucune ligne valide à importer' };
    }

    // Update status to queued
    await supabase
      .from('import_jobs')
      .update({
        status: 'queued',
        assignment_config: config.assignment as unknown as Record<string, unknown>,
        duplicate_config: config.duplicates as unknown as Record<string, unknown>,
      })
      .eq('id', importJobId);

    // Enqueue commit job via QStash
    const messageId = await enqueueCommitJob({
      importJobId,
      assignment: config.assignment,
      duplicates: config.duplicates,
      defaultStatus: config.defaultStatus,
      defaultSource: config.defaultSource,
    });

    revalidatePath('/import');
    return { success: true, data: { messageId } };
  } catch (error) {

    // Try to update status back to ready
    try {
      const supabase = await createClient();
      await supabase
        .from('import_jobs')
        .update({ status: 'ready' })
        .eq('id', importJobId);
    } catch {
      // Ignore secondary errors
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

// =============================================================================
// CLIENT-SIDE IMPORT ROWS (bypass Edge Function for large files)
// =============================================================================

/**
 * Insert validated import rows directly from client
 * This bypasses the Edge Function parsing for better performance with large files
 */
export async function insertImportRowsBatch(
  importJobId: string,
  rows: Array<{
    row_number: number;
    raw_data: Record<string, string>;
    normalized_data: Record<string, string | null>;
    validation_errors: Record<string, string> | null;
    status: 'valid' | 'invalid';
  }>,
  progress: {
    currentChunk: number;
    totalChunks: number;
    totalRows: number;
    validRows: number;
    invalidRows: number;
  }
): Promise<ImportActionResult<void>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Insert rows batch
    const importRows = rows.map((row) => ({
      import_job_id: importJobId,
      row_number: row.row_number,
      chunk_number: progress.currentChunk,
      status: row.status,
      raw_data: row.raw_data,
      normalized_data: row.normalized_data,
      validation_errors: row.validation_errors,
    }));

    const { error: insertError } = await supabase
      .from('import_rows')
      .insert(importRows);

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Update job progress
    await supabase
      .from('import_jobs')
      .update({
        current_chunk: progress.currentChunk + 1,
        total_rows: progress.totalRows,
        valid_rows: progress.validRows,
        invalid_rows: progress.invalidRows,
        status: progress.currentChunk + 1 >= progress.totalChunks ? 'ready' : 'parsing',
      })
      .eq('id', importJobId);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Mark import job as ready after client-side parsing
 */
export async function markImportJobReady(
  importJobId: string,
  stats: { totalRows: number; validRows: number; invalidRows: number }
): Promise<ImportActionResult<void>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    await supabase
      .from('import_jobs')
      .update({
        status: 'ready',
        total_rows: stats.totalRows,
        valid_rows: stats.validRows,
        invalid_rows: stats.invalidRows,
      })
      .eq('id', importJobId);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

// =============================================================================
// IMPORT ROWS
// =============================================================================

/**
 * Get import rows with validation details
 */
export async function getImportRows(
  importJobId: string,
  options: {
    status?: 'pending' | 'valid' | 'invalid' | 'imported' | 'skipped';
    page?: number;
    pageSize?: number;
  } = {}
): Promise<
  ImportActionResult<{
    rows: ImportRowWithDetails[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>
> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const page = options.page || 1;
    const pageSize = options.pageSize || 50;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('import_rows')
      .select('id, row_number, status, raw_data, normalized_data, validation_errors', {
        count: 'exact',
      })
      .eq('import_job_id', importJobId)
      .order('row_number', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (options.status) {
      query = query.eq('status', options.status);
    }

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const totalPages = Math.ceil((count || 0) / pageSize);

    return {
      success: true,
      data: {
        rows: (data || []) as ImportRowWithDetails[],
        total: count || 0,
        page,
        pageSize,
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

// =============================================================================
// CLEANUP
// =============================================================================

/**
 * Cancel/delete an import job
 */
export async function deleteImportJob(
  importJobId: string
): Promise<ImportActionResult<void>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Get the job to find storage path
    const { data: job } = await supabase
      .from('import_jobs')
      .select('storage_path, status')
      .eq('id', importJobId)
      .single();

    if (!job) {
      return { success: false, error: 'Job non trouvé' };
    }

    // Don't allow deletion of active imports
    if (['parsing', 'importing'].includes(job.status)) {
      return { success: false, error: 'Impossible de supprimer un import en cours' };
    }

    // Delete from storage
    if (job.storage_path) {
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

    revalidatePath('/import');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Cancel an in-progress import job
 * Note: This only marks the job as cancelled - the worker will check this status
 * and stop processing if it sees it has been cancelled.
 */
export async function cancelImportJob(
  importJobId: string
): Promise<ImportActionResult<void>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Get the job to check status
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('status')
      .eq('id', importJobId)
      .single();

    if (jobError || !job) {
      return { success: false, error: 'Job non trouvé' };
    }

    // Only allow cancellation of queued/parsing/importing jobs
    if (!['queued', 'parsing', 'importing'].includes(job.status)) {
      return { success: false, error: 'Ce job ne peut pas être annulé' };
    }

    // Mark as cancelled
    const { error } = await supabase
      .from('import_jobs')
      .update({
        status: 'cancelled',
        error_message: 'Annulé par l\'utilisateur',
      })
      .eq('id', importJobId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/import');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Poll import job status (used by UI for real-time updates)
 * Returns minimal data for efficient polling
 */
export async function pollImportJobStatus(
  importJobId: string
): Promise<
  ImportActionResult<{
    status: string;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    importedRows: number;
    skippedRows: number;
    processedRows: number;
    errorMessage: string | null;
    completedAt: string | null;
  }>
> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data: job, error } = await supabase
      .from('import_jobs')
      .select(`
        status,
        total_rows,
        valid_rows,
        invalid_rows,
        imported_rows,
        skipped_rows,
        processed_rows,
        error_message,
        completed_at
      `)
      .eq('id', importJobId)
      .single();

    if (error || !job) {
      return { success: false, error: 'Job non trouvé' };
    }

    return {
      success: true,
      data: {
        status: job.status,
        totalRows: job.total_rows || 0,
        validRows: job.valid_rows || 0,
        invalidRows: job.invalid_rows || 0,
        importedRows: job.imported_rows || 0,
        skippedRows: job.skipped_rows || 0,
        processedRows: job.processed_rows || 0,
        errorMessage: job.error_message,
        completedAt: job.completed_at,
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
 * Retry a failed import job
 * Resets the job status and re-queues it for processing
 */
export async function retryImportJob(
  importJobId: string,
  retryPhase: 'parse' | 'commit'
): Promise<ImportActionResult<{ messageId: string }>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Get the job to verify state
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('status')
      .eq('id', importJobId)
      .single();

    if (jobError || !job) {
      return { success: false, error: 'Job non trouvé' };
    }

    if (job.status !== 'failed') {
      return { success: false, error: 'Seuls les jobs en erreur peuvent être relancés' };
    }

    // Clear error and reset status
    await supabase
      .from('import_jobs')
      .update({
        status: 'queued',
        error_message: null,
      })
      .eq('id', importJobId);

    // Enqueue appropriate job
    let messageId: string;
    if (retryPhase === 'parse') {
      messageId = await enqueueParseJob({ importJobId });
    } else {
      // Get existing config for commit retry
      const { data: fullJob } = await supabase
        .from('import_jobs')
        .select('assignment_config, duplicate_config')
        .eq('id', importJobId)
        .single();

      if (!fullJob?.assignment_config || !fullJob?.duplicate_config) {
        return { success: false, error: 'Configuration de l\'import manquante' };
      }

      messageId = await enqueueCommitJob({
        importJobId,
        assignment: fullJob.assignment_config as AssignmentConfig,
        duplicates: fullJob.duplicate_config as DuplicateConfig,
      });
    }

    revalidatePath('/import');
    return { success: true, data: { messageId } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

// =============================================================================
// FILE DOWNLOAD
// =============================================================================

/**
 * Get a signed URL to download the original import file
 */
export async function downloadImportFile(
  importJobId: string
): Promise<ImportActionResult<{ url: string; fileName: string }>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Get the job to find storage path and file name
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('storage_path, file_name')
      .eq('id', importJobId)
      .single();

    if (jobError || !job) {
      return { success: false, error: 'Job non trouvé' };
    }

    if (!job.storage_path) {
      return { success: false, error: 'Fichier non disponible' };
    }

    // Create a signed URL (valid for 1 hour)
    const { data: signedUrl, error: signError } = await supabase.storage
      .from('imports')
      .createSignedUrl(job.storage_path, 3600);

    if (signError || !signedUrl) {
      return { success: false, error: 'Impossible de générer le lien de téléchargement' };
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
