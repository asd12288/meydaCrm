/**
 * Import Parse Worker
 *
 * This API route handles the parsing phase of an import.
 * It is called by QStash with automatic retries.
 *
 * Process:
 * 1. Verify QStash signature (or admin auth for direct calls)
 * 2. Download file from Supabase Storage
 * 3. Stream parse CSV/XLSX row by row
 * 4. Validate each row
 * 5. Insert into import_rows table in batches
 * 6. Update progress with checkpoints
 * 7. Mark job as ready when complete
 */

import { createClient } from '@supabase/supabase-js';
import { createQStashHandler, type ParseJobPayload } from '@/modules/import/lib/queue';
import { streamParseFile } from '@/modules/import/lib/parsers/index';
import type { ParsedRow } from '@/modules/import/lib/parsers/csv-streamer';
import type { ColumnMapping, ColumnMappingConfig } from '@/modules/import/types';

// Vercel function configuration
export const maxDuration = 300; // 5 minutes max
export const dynamic = 'force-dynamic';

// Batch size for database inserts
const INSERT_BATCH_SIZE = 500;

/**
 * Create admin Supabase client (bypasses RLS)
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
 * Main parse handler
 */
async function handleParse(payload: ParseJobPayload): Promise<{
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  processingTimeMs: number;
}> {
  const { importJobId, startChunk = 0 } = payload;
  const startTime = Date.now();

  console.log(`[Parse] Starting job ${importJobId} from chunk ${startChunk}`);

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
      error_details: null,
      worker_id: payload.importJobId, // Track which worker is processing
    })
    .eq('id', importJobId);

  try {
    // Get signed URL for the file
    const { data: urlData, error: urlError } = await supabase.storage
      .from('imports')
      .createSignedUrl(job.storage_path, 3600); // 1 hour expiry

    if (urlError || !urlData?.signedUrl) {
      throw new Error(`Failed to get signed URL: ${urlError?.message}`);
    }

    // Get column mappings
    const mappingConfig = job.column_mapping as ColumnMappingConfig | null;
    if (!mappingConfig?.mappings) {
      throw new Error('Column mapping not configured');
    }

    // Calculate start row from checkpoint
    const checkpoint = job.last_checkpoint as { rowNumber?: number } | null;
    const startRow = startChunk > 0
      ? (checkpoint?.rowNumber || 1)
      : 1;

    // If resuming, clear rows after the checkpoint
    if (startRow > 1) {
      console.log(`[Parse] Resuming from row ${startRow}, clearing subsequent rows...`);
      await supabase
        .from('import_rows')
        .delete()
        .eq('import_job_id', importJobId)
        .gte('row_number', startRow);
    }

    // Counters for progress
    let totalRows = 0;
    let validRows = 0;
    let invalidRows = 0;
    let currentChunk = startChunk;

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
          // Prepare rows for insert
          const insertRows = rows.map((row) => ({
            import_job_id: importJobId,
            row_number: row.rowNumber,
            chunk_number: row.chunkNumber,
            status: row.isValid ? 'valid' as const : 'invalid' as const,
            raw_data: row.rawData,
            normalized_data: row.normalizedData,
            validation_errors: Object.keys(row.errors).length > 0 ? row.errors : null,
          }));

          // Batch insert
          const { error: insertError } = await supabase
            .from('import_rows')
            .insert(insertRows);

          if (insertError) {
            console.error(`[Parse] Insert error for chunk ${currentChunk}:`, insertError);
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

          // Save checkpoint
          const checkpointData = {
            chunkNumber: currentChunk,
            rowNumber: rows[rows.length - 1].rowNumber,
            validCount: validRows,
            invalidCount: invalidRows,
            timestamp: new Date().toISOString(),
          };

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
            `[Parse] Chunk ${currentChunk}: ${totalRows} total, ${validRows} valid, ${invalidRows} invalid`
          );

          currentChunk++;
        },

        // Progress is handled in onChunk, so we don't need onProgress callback

        onError: async (error: Error) => {
          console.error(`[Parse] Error:`, error);

          // Save error state but keep checkpoint
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

    // Mark job as ready
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

    console.log(
      `[Parse] Complete: ${stats.totalRows} rows, ${stats.validRows} valid, ${stats.invalidRows} invalid, ${stats.processingTimeMs}ms`
    );

    return {
      success: true,
      totalRows: stats.totalRows,
      validRows: stats.validRows,
      invalidRows: stats.invalidRows,
      processingTimeMs: Date.now() - startTime,
    };

  } catch (error) {
    console.error(`[Parse] Job ${importJobId} failed:`, error);

    // Update job status to failed
    await supabase
      .from('import_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', importJobId);

    throw error; // Re-throw to trigger QStash retry
  }
}

/**
 * POST handler - called by QStash
 */
export const POST = createQStashHandler<ParseJobPayload>(handleParse);

/**
 * GET handler - for health checks and manual testing
 */
export async function GET() {
  return Response.json({
    status: 'ok',
    worker: 'import-parse',
    maxDuration,
  });
}
