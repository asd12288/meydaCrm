/**
 * Parse Worker - Core Logic
 *
 * Can be called directly from server actions (local dev)
 * or via API route from QStash (production)
 *
 * After parsing completes successfully, automatically triggers the commit worker.
 */

import { createClient } from '@supabase/supabase-js';
import { streamParseFile } from '../lib/parsers/index';
import type { ParsedRow } from '../lib/parsers/csv-streamer';
import type { ColumnMapping, ColumnMappingConfig, AssignmentConfig, DuplicateConfig } from '../types';
import { notifyImportFailed } from '@/modules/notifications';
import { enqueueCommitJob } from '../lib/queue';

const INSERT_BATCH_SIZE = 500;

// Estimated average row size in bytes for chunk estimation
// Conservative estimate: typical CSV row is 200-500 bytes
const ESTIMATED_AVG_ROW_SIZE_BYTES = 300;

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
 * Main parse handler - can be called directly or from API route
 */
export async function handleParseDirectly(importJobId: string): Promise<{
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
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

  // Update status to parsing
  await supabase
    .from('import_jobs')
    .update({
      status: 'parsing',
      error_message: null,
      worker_id: 'direct-worker',
    })
    .eq('id', importJobId);

  try {
    // Get signed URL for the file
    const { data: urlData, error: urlError } = await supabase.storage
      .from('imports')
      .createSignedUrl(job.storage_path, 3600);

    if (urlError || !urlData?.signedUrl) {
      throw new Error(`Failed to get signed URL: ${urlError?.message}`);
    }

    // Get file metadata for size estimation
    let estimatedTotalChunks: number | null = null;

    const { data: fileList } = await supabase.storage
      .from('imports')
      .list(job.storage_path.split('/').slice(0, -1).join('/'), {
        search: job.storage_path.split('/').pop() || '',
      });

    const fileMetadata = fileList?.find(f => job.storage_path.endsWith(f.name));
    if (fileMetadata?.metadata?.size) {
      const fileSize = fileMetadata.metadata.size as number;
      const estimatedRows = Math.ceil(fileSize / ESTIMATED_AVG_ROW_SIZE_BYTES);
      estimatedTotalChunks = Math.max(1, Math.ceil(estimatedRows / INSERT_BATCH_SIZE));

      await supabase
        .from('import_jobs')
        .update({ total_chunks: estimatedTotalChunks })
        .eq('id', importJobId);
    }

    // Get column mappings
    const mappingConfig = job.column_mapping as ColumnMappingConfig | null;
    if (!mappingConfig?.mappings) {
      throw new Error('Column mapping not configured');
    }

    // Counters
    let totalRows = 0;
    let validRows = 0;
    let invalidRows = 0;
    let currentChunk = 0;

    // Stream parse the file
    const stats = await streamParseFile(
      urlData.signedUrl,
      job.file_type as 'csv' | 'xlsx',
      {
        mappings: mappingConfig.mappings as ColumnMapping[],
        startRow: 1,
        chunkSize: INSERT_BATCH_SIZE,
        sheetName: mappingConfig.sheetName,

        onChunk: async (rows: ParsedRow[]) => {
          // Prepare rows for insert
          const insertRows = rows.map((row) => ({
            import_job_id: importJobId,
            row_number: row.rowNumber,
            chunk_number: row.chunkNumber,
            status: row.isValid ? ('valid' as const) : ('invalid' as const),
            raw_data: row.rawData,
            normalized_data: row.normalizedData,
            validation_errors: Object.keys(row.errors).length > 0 ? row.errors : null,
          }));

          // Batch insert
          const { error: insertError } = await supabase
            .from('import_rows')
            .insert(insertRows);

          if (insertError) {
            throw new Error(`Failed to insert rows: ${insertError.message}`);
          }

          // Update counters
          for (const row of rows) {
            totalRows++;
            if (row.isValid) {
              validRows++;
            } else {
              invalidRows++;
            }
          }

          // Save progress
          await supabase
            .from('import_jobs')
            .update({
              current_chunk: currentChunk,
              processed_rows: totalRows,
              valid_rows: validRows,
              invalid_rows: invalidRows,
            })
            .eq('id', importJobId);

          currentChunk++;
        },

        onError: async (error: Error) => {
          await supabase
            .from('import_jobs')
            .update({
              status: 'failed',
              error_message: error.message,
            })
            .eq('id', importJobId);
        },
      }
    );

    // Check if there are valid rows to commit
    if (stats.validRows === 0) {
      await supabase
        .from('import_jobs')
        .update({
          status: 'completed',
          total_rows: stats.totalRows,
          valid_rows: 0,
          invalid_rows: stats.invalidRows,
          imported_rows: 0,
          skipped_rows: 0,
          processed_rows: stats.totalRows,
          total_chunks: currentChunk,
          completed_at: new Date().toISOString(),
        })
        .eq('id', importJobId);

      return {
        success: true,
        totalRows: stats.totalRows,
        validRows: 0,
        invalidRows: stats.invalidRows,
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Get assignment and duplicate config from job for commit
    const assignmentConfig = job.assignment_config as AssignmentConfig | null;
    const duplicateConfig = job.duplicate_config as DuplicateConfig | null;

    // Use default configs if not set
    const finalAssignment: AssignmentConfig = assignmentConfig || { mode: 'none' };
    const finalDuplicates: DuplicateConfig = duplicateConfig || {
      strategy: 'skip',
      checkFields: ['email'],
      checkDatabase: true,
      checkWithinFile: true,
    };

    // Update job status and trigger commit
    await supabase
      .from('import_jobs')
      .update({
        status: 'importing',
        total_rows: stats.totalRows,
        valid_rows: stats.validRows,
        invalid_rows: stats.invalidRows,
        processed_rows: stats.totalRows,
        total_chunks: currentChunk,
      })
      .eq('id', importJobId);

    // Queue commit job via QStash
    await enqueueCommitJob({
      importJobId,
      assignment: finalAssignment,
      duplicates: finalDuplicates,
      defaultStatus: 'new',
      defaultSource: `Import ${job.file_name}`,
    });

    return {
      success: true,
      totalRows: stats.totalRows,
      validRows: stats.validRows,
      invalidRows: stats.invalidRows,
      processingTimeMs: Date.now() - startTime,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Get job to find creator
    const { data: job } = await supabase
      .from('import_jobs')
      .select('created_by, file_name')
      .eq('id', importJobId)
      .single();

    // Update job status to failed
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
