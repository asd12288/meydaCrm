/**
 * Parse Worker - Core Logic
 *
 * Can be called directly from server actions (local dev)
 * or via API route from QStash (production)
 *
 * After parsing completes, sets job status to 'ready' so user can review
 * the preview before deciding to commit.
 */

import { createClient } from '@supabase/supabase-js';
import { streamParseFile } from '../lib/parsers/index';
import type { ParsedRow } from '../lib/parsers/csv-streamer';
import type { ColumnMapping, ColumnMappingConfig } from '../types';
import { notifyImportFailed } from '@/modules/notifications';

const LOG_PREFIX = '[ParseWorker]';
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
  console.log(LOG_PREFIX, 'handleParseDirectly START', importJobId);
  const startTime = Date.now();
  const supabase = createAdminClient();

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
  console.log(LOG_PREFIX, 'Job found:', { fileName: job.file_name, fileType: job.file_type, storagePath: job.storage_path });

  // Update status to parsing
  console.log(LOG_PREFIX, 'Updating job status to parsing');
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
    console.log(LOG_PREFIX, 'Getting signed URL for:', job.storage_path);
    const { data: urlData, error: urlError } = await supabase.storage
      .from('imports')
      .createSignedUrl(job.storage_path, 3600);

    if (urlError || !urlData?.signedUrl) {
      console.error(LOG_PREFIX, 'Failed to get signed URL:', urlError);
      throw new Error(`Failed to get signed URL: ${urlError?.message}`);
    }
    console.log(LOG_PREFIX, 'Got signed URL');

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
      console.log(LOG_PREFIX, 'File metadata:', { fileSize, estimatedRows, estimatedTotalChunks });

      await supabase
        .from('import_jobs')
        .update({ total_chunks: estimatedTotalChunks })
        .eq('id', importJobId);
    }

    // Get column mappings
    const mappingConfig = job.column_mapping as ColumnMappingConfig | null;
    if (!mappingConfig?.mappings) {
      console.error(LOG_PREFIX, 'Column mapping not configured');
      throw new Error('Column mapping not configured');
    }
    console.log(LOG_PREFIX, 'Column mappings loaded:', mappingConfig.mappings.length, 'columns');

    // Counters
    let totalRows = 0;
    let validRows = 0;
    let invalidRows = 0;
    let currentChunk = 0;

    // Stream parse the file
    console.log(LOG_PREFIX, 'Starting stream parse...');
    const stats = await streamParseFile(
      urlData.signedUrl,
      job.file_type as 'csv' | 'xlsx',
      {
        mappings: mappingConfig.mappings as ColumnMapping[],
        startRow: 1,
        chunkSize: INSERT_BATCH_SIZE,
        sheetName: mappingConfig.sheetName,

        onChunk: async (rows: ParsedRow[]) => {
          console.log(LOG_PREFIX, `Processing chunk ${currentChunk}, ${rows.length} rows`);
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
            console.error(LOG_PREFIX, 'Failed to insert rows:', insertError);
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
          console.log(LOG_PREFIX, `Chunk ${currentChunk - 1} complete. Total: ${totalRows}, Valid: ${validRows}, Invalid: ${invalidRows}`);
        },

        onError: async (error: Error) => {
          console.error(LOG_PREFIX, 'Parse error callback:', error);
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
    console.log(LOG_PREFIX, 'Stream parse complete:', stats);

    // Check if there are valid rows to commit
    if (stats.validRows === 0) {
      console.log(LOG_PREFIX, 'No valid rows, marking job as completed');
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

      const processingTimeMs = Date.now() - startTime;
      console.log(LOG_PREFIX, 'handleParseDirectly COMPLETE (no valid rows)', { processingTimeMs });
      return {
        success: true,
        totalRows: stats.totalRows,
        validRows: 0,
        invalidRows: stats.invalidRows,
        processingTimeMs,
      };
    }

    // Update job status to 'ready' - waiting for user to review preview and start commit
    // The commit will be triggered separately when user clicks "Lancer l'import"
    console.log(LOG_PREFIX, 'Marking job as ready for commit');
    await supabase
      .from('import_jobs')
      .update({
        status: 'ready',
        total_rows: stats.totalRows,
        valid_rows: stats.validRows,
        invalid_rows: stats.invalidRows,
        processed_rows: stats.totalRows,
        total_chunks: currentChunk,
      })
      .eq('id', importJobId);

    const processingTimeMs = Date.now() - startTime;
    console.log(LOG_PREFIX, 'handleParseDirectly COMPLETE', { totalRows: stats.totalRows, validRows: stats.validRows, invalidRows: stats.invalidRows, processingTimeMs });
    return {
      success: true,
      totalRows: stats.totalRows,
      validRows: stats.validRows,
      invalidRows: stats.invalidRows,
      processingTimeMs,
    };

  } catch (error) {
    console.error(LOG_PREFIX, 'handleParseDirectly ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Get job to find creator
    const { data: job } = await supabase
      .from('import_jobs')
      .select('created_by, file_name')
      .eq('id', importJobId)
      .single();

    // Update job status to failed
    console.log(LOG_PREFIX, 'Marking job as failed');
    await supabase
      .from('import_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', importJobId);

    // Send notification to import creator
    if (job?.created_by) {
      console.log(LOG_PREFIX, 'Sending failure notification');
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
