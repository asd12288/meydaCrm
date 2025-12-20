'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/modules/auth';
import type {
  ImportActionResult,
  ImportJobWithStats,
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
): Promise<ImportActionResult<{ importJobId: string; storagePath: string }>> {
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
      console.error('Storage upload error:', uploadError);
      return {
        success: false,
        error: `Erreur lors du telechargement: ${uploadError.message}`,
      };
    }

    // Create import job record
    const { data: importJob, error: dbError } = await supabase
      .from('import_jobs')
      .insert({
        created_by: user.id,
        file_name: file.name,
        file_type: ext,
        storage_path: storagePath,
        status: 'pending',
      })
      .select('id')
      .single();

    if (dbError) {
      // Clean up uploaded file if DB insert fails
      await supabase.storage.from('imports').remove([storagePath]);
      console.error('DB insert error:', dbError);
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
    console.error('Upload error:', error);
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
      .select('*, creator:profiles!import_jobs_created_by_fk(id, display_name)')
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
      .select('*, creator:profiles!import_jobs_created_by_fk(id, display_name)')
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

// =============================================================================
// EDGE FUNCTION INVOCATION
// =============================================================================

/**
 * Start the import parsing process via Edge Function
 */
export async function startImportParsing(
  importJobId: string
): Promise<ImportActionResult<void>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Get current session for auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Session expirée' };
    }

    // Update status to parsing
    await supabase
      .from('import_jobs')
      .update({ status: 'parsing', started_at: new Date().toISOString() })
      .eq('id', importJobId);

    // Invoke edge function
    const { error } = await supabase.functions.invoke('import-parse', {
      body: { importJobId },
    });

    if (error) {
      // Revert status on error
      await supabase
        .from('import_jobs')
        .update({ status: 'failed', error_message: error.message })
        .eq('id', importJobId);

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
 * Start the import commit process via Edge Function
 */
export async function startImportCommit(
  importJobId: string,
  config: {
    assignment: AssignmentConfig;
    duplicates: DuplicateConfig;
    defaultStatus?: string;
    defaultSource?: string;
  }
): Promise<ImportActionResult<void>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Get current session for auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Session expirée' };
    }

    // Note: Don't update status here - the edge function checks for "ready" status
    // and will set it to "importing" internally

    // Invoke edge function
    const { error } = await supabase.functions.invoke('import-commit', {
      body: {
        importJobId,
        ...config,
      },
    });

    if (error) {
      // Revert status on error
      await supabase
        .from('import_jobs')
        .update({ status: 'failed', error_message: error.message })
        .eq('id', importJobId);

      return { success: false, error: error.message };
    }

    revalidatePath('/import');
    revalidatePath('/leads');
    return { success: true };
  } catch (error) {
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
      console.error('Insert error:', insertError);
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
    rows: Array<{
      id: string;
      row_number: number;
      status: string;
      raw_data: Record<string, unknown>;
      normalized_data: Record<string, unknown> | null;
      validation_errors: Record<string, string> | null;
    }>;
    total: number;
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

    return {
      success: true,
      data: {
        rows: data || [],
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
