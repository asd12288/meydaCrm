/**
 * Direct Parse Worker (for local development)
 *
 * This endpoint bypasses QStash for local testing.
 * In production, use /api/import/parse with QStash.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { streamParseFile } from '@/modules/import/lib/parsers/index';
import type { ParsedRow } from '@/modules/import/lib/parsers/csv-streamer';
import type { ColumnMapping, ColumnMappingConfig } from '@/modules/import/types';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const INSERT_BATCH_SIZE = 500;

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

export async function POST(request: NextRequest) {
  try {
    const { importJobId } = await request.json();

    if (!importJobId) {
      return NextResponse.json(
        { error: 'Missing importJobId' },
        { status: 400 }
      );
    }

    console.log(`[Parse Direct] Starting job ${importJobId}`);

    const supabase = createAdminClient();

    // Get the import job
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', importJobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: `Job not found: ${importJobId}` },
        { status: 404 }
      );
    }

    // Update status to parsing
    await supabase
      .from('import_jobs')
      .update({
        status: 'parsing',
        error_message: null,
        worker_id: 'direct-parse',
      })
      .eq('id', importJobId);

    // Get signed URL for the file
    const { data: urlData, error: urlError } = await supabase.storage
      .from('imports')
      .createSignedUrl(job.storage_path, 3600);

    if (urlError || !urlData?.signedUrl) {
      throw new Error(`Failed to get signed URL: ${urlError?.message}`);
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
            console.error(`[Parse Direct] Insert error:`, insertError);
            throw new Error(`Failed to insert rows: ${insertError.message}`);
          }

          // Update counters
          for (const row of rows) {
            totalRows++;
            if (row.isValid) validRows++;
            else invalidRows++;
          }

          // Save checkpoint
          await supabase
            .from('import_jobs')
            .update({
              current_chunk: currentChunk,
              processed_rows: totalRows,
              valid_rows: validRows,
              invalid_rows: invalidRows,
              last_checkpoint: {
                chunkNumber: currentChunk,
                rowNumber: rows[rows.length - 1].rowNumber,
                validCount: validRows,
                invalidCount: invalidRows,
                timestamp: new Date().toISOString(),
              },
            })
            .eq('id', importJobId);

          console.log(
            `[Parse Direct] Chunk ${currentChunk}: ${totalRows} total, ${validRows} valid, ${invalidRows} invalid`
          );

          currentChunk++;
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
      `[Parse Direct] Complete: ${stats.totalRows} rows, ${stats.validRows} valid, ${stats.invalidRows} invalid`
    );

    return NextResponse.json({
      success: true,
      totalRows: stats.totalRows,
      validRows: stats.validRows,
      invalidRows: stats.invalidRows,
    });

  } catch (error) {
    console.error('[Parse Direct] Error:', error);

    // Try to update job status
    try {
      const supabase = createAdminClient();
      const { importJobId } = await request.json();
      await supabase
        .from('import_jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', importJobId);
    } catch {
      // Ignore
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    worker: 'parse-direct',
    note: 'Local development endpoint - bypasses QStash',
  });
}
