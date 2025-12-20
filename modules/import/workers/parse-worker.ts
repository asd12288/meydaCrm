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

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 [ParseWorker] STARTING PARSE JOB');
  console.log(`📋 [ParseWorker] Job ID: ${importJobId}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('🔌 [ParseWorker] Creating admin Supabase client...');
  const supabase = createAdminClient();
  console.log('✅ [ParseWorker] Supabase client created');

  // Get the import job
  console.log('📥 [ParseWorker] Fetching job from database...');
  const { data: job, error: jobError } = await supabase
    .from('import_jobs')
    .select('*')
    .eq('id', importJobId)
    .single();

  if (jobError || !job) {
    console.error('❌ [ParseWorker] Job not found:', jobError);
    throw new Error(`Job not found: ${importJobId}`);
  }

  console.log('✅ [ParseWorker] Job loaded:', {
    fileName: job.file_name,
    fileType: job.file_type,
    status: job.status,
    storagePath: job.storage_path,
  });

  // Update status to parsing
  console.log('📝 [ParseWorker] Updating job status to "parsing"...');
  await supabase
    .from('import_jobs')
    .update({
      status: 'parsing',
      error_message: null,
      error_details: null,
      worker_id: 'direct-worker',
    })
    .eq('id', importJobId);
  console.log('✅ [ParseWorker] Status updated to "parsing"');

  try {
    // Get signed URL for the file
    console.log(`🔗 [ParseWorker] Getting signed URL for: ${job.storage_path}`);
    const { data: urlData, error: urlError } = await supabase.storage
      .from('imports')
      .createSignedUrl(job.storage_path, 3600);

    if (urlError || !urlData?.signedUrl) {
      console.error('❌ [ParseWorker] Failed to get signed URL:', urlError);
      throw new Error(`Failed to get signed URL: ${urlError?.message}`);
    }

    console.log('✅ [ParseWorker] Signed URL obtained');
    console.log(`🔗 [ParseWorker] URL: ${urlData.signedUrl.substring(0, 80)}...`);

    // Get column mappings
    console.log('🗺️ [ParseWorker] Checking column mappings...');
    const mappingConfig = job.column_mapping as ColumnMappingConfig | null;
    if (!mappingConfig?.mappings) {
      console.error('❌ [ParseWorker] No column mapping configured');
      throw new Error('Column mapping not configured');
    }

    console.log(`✅ [ParseWorker] Found ${mappingConfig.mappings.length} column mappings`);

    // Calculate start row from checkpoint
    const checkpoint = job.last_checkpoint as { rowNumber?: number } | null;
    const startRow = checkpoint?.rowNumber ? checkpoint.rowNumber + 1 : 1;

    // Clear rows after checkpoint if resuming
    if (startRow > 1) {
      console.log(`🔄 [ParseWorker] Resuming from row ${startRow}, clearing subsequent rows...`);
      await supabase
        .from('import_rows')
        .delete()
        .eq('import_job_id', importJobId)
        .gte('row_number', startRow);
      console.log('✅ [ParseWorker] Old rows cleared');
    } else {
      console.log('🆕 [ParseWorker] Starting fresh parse (row 1)');
    }

    // Counters
    let totalRows = 0;
    let validRows = 0;
    let invalidRows = 0;
    let currentChunk = 0;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 [ParseWorker] STARTING STREAM PARSE');
    console.log(`📄 [ParseWorker] File type: ${job.file_type}`);
    console.log(`📊 [ParseWorker] Chunk size: ${INSERT_BATCH_SIZE} rows`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Stream parse the file
    const stats = await streamParseFile(
      urlData.signedUrl,
      job.file_type as 'csv' | 'xlsx',
      {
        mappings: mappingConfig.mappings as ColumnMapping[],
        startRow,
        chunkSize: INSERT_BATCH_SIZE,
        sheetName: mappingConfig.sheetName,

        onChunk: async (rows: ParsedRow[]) => {
          console.log(`📦 [ParseWorker] Processing chunk ${currentChunk} with ${rows.length} rows...`);
          
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
          console.log(`💾 [ParseWorker] Inserting ${insertRows.length} rows to database...`);
          const { error: insertError } = await supabase
            .from('import_rows')
            .insert(insertRows);

          if (insertError) {
            console.error(`❌ [ParseWorker] Insert error for chunk ${currentChunk}:`, insertError);
            throw new Error(`Failed to insert rows: ${insertError.message}`);
          }
          console.log(`✅ [ParseWorker] Chunk ${currentChunk} inserted successfully`);

          // Update counters
          for (const row of rows) {
            totalRows++;
            if (row.isValid) {
              validRows++;
            } else {
              invalidRows++;
            }
          }

          // Save checkpoint
          const checkpointData = {
            chunkNumber: currentChunk,
            rowNumber: rows[rows.length - 1].rowNumber,
            validCount: validRows,
            invalidCount: invalidRows,
            timestamp: new Date().toISOString(),
          };

          console.log(`💾 [ParseWorker] Saving checkpoint...`);
          await supabase
            .from('import_jobs')
            .update({
              current_chunk: currentChunk,
              processed_rows: totalRows,
              valid_rows: validRows,
              invalid_rows: invalidRows,
              last_checkpoint: checkpointData,
            })
            .eq('id', importJobId);

          console.log(
            `✅ [ParseWorker] Chunk ${currentChunk} complete: ${totalRows} total (${validRows} valid, ${invalidRows} invalid)`
          );

          currentChunk++;

          // Small delay in local mode to allow SSE to poll for updates
          // This prevents the progress from jumping 0→100% instantly
          const isLocalMode = !process.env.VERCEL_URL && !process.env.APP_URL;
          if (isLocalMode) {
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        },

        onError: async (error: Error) => {
          console.error(`[ParseWorker] Error:`, error);

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

    // Parse complete - now trigger commit
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏁 [ParseWorker] PARSE COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const speed = Math.round(stats.totalRows / (Date.now() - startTime) * 1000);

    console.log(`📊 [ParseWorker] Total: ${stats.totalRows.toLocaleString()} rows`);
    console.log(`✅ [ParseWorker] Valid: ${stats.validRows.toLocaleString()} rows`);
    console.log(`❌ [ParseWorker] Invalid: ${stats.invalidRows.toLocaleString()} rows`);
    console.log(`⏱️ [ParseWorker] Duration: ${duration}s`);
    console.log(`⚡ [ParseWorker] Speed: ${speed.toLocaleString()} rows/sec`);

    // Check if there are valid rows to commit
    if (stats.validRows === 0) {
      console.log('⚠️ [ParseWorker] No valid rows to import - marking as completed');
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

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔗 [ParseWorker] CHAINING TO COMMIT WORKER');
    console.log(`📋 [ParseWorker] Assignment mode: ${finalAssignment.mode}`);
    console.log(`📋 [ParseWorker] Duplicate strategy: ${finalDuplicates.strategy}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Update job status - mark as ready briefly then trigger commit
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

    // Check if running locally (no QStash)
    const isLocal = !process.env.VERCEL_URL && !process.env.APP_URL;

    if (isLocal) {
      // Run commit as background task for local development
      // This allows the parse response to return immediately while commit continues
      console.log('🏠 [ParseWorker] LOCAL MODE - Starting commit as background task');

      // Import the commit worker
      const { handleCommitDirectly } = await import('./commit-worker');

      // Spawn background task (don't await)
      setImmediate(async () => {
        console.log('🚀 [Background] Commit worker starting...');
        try {
          await handleCommitDirectly(
            importJobId,
            finalAssignment,
            finalDuplicates,
            'new', // defaultStatus
            `Import ${job.file_name}` // defaultSource
          );
          console.log('✅ [Background] Commit completed successfully');
        } catch (commitError) {
          console.error('❌ [Background] Commit failed:', commitError);
          // Error is logged but doesn't affect parse response
          // The job status will be updated by the commit worker
        }
      });

      console.log('✅ [ParseWorker] Commit spawned in background');
    } else {
      // Queue commit job via QStash for production
      console.log('☁️ [ParseWorker] PRODUCTION MODE - Queuing commit job via QStash');
      const commitMessageId = await enqueueCommitJob({
        importJobId,
        assignment: finalAssignment,
        duplicates: finalDuplicates,
        defaultStatus: 'new',
        defaultSource: `Import ${job.file_name}`,
      });
      console.log(`✅ [ParseWorker] Commit job queued: ${commitMessageId}`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [ParseWorker] PARSE → COMMIT CHAIN COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      success: true,
      totalRows: stats.totalRows,
      validRows: stats.validRows,
      invalidRows: stats.invalidRows,
      processingTimeMs: Date.now() - startTime,
    };

  } catch (error) {
    console.error(`[ParseWorker] Job ${importJobId} failed:`, error);

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
