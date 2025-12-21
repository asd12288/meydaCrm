/**
 * Export Worker - Core Logic
 *
 * Generates CSV files from leads and uploads to Supabase Storage.
 * Called via QStash webhook from /api/export/run
 */

import { createClient } from '@supabase/supabase-js';
import {
  UTF8_BOM,
  getCSVHeader,
  encodeCSVRow,
  formatLeadForCSV,
  sanitizeSearchTerm,
  isValidSortColumn,
} from '@/modules/leads/lib/export';
import { EXPORT_BUCKET_NAME, EXPORT_FILE_EXPIRY_HOURS, EXPORT_CHUNK_SIZE } from '../config/constants';
import type { ExportFilters } from '../types';

const MIN_SEARCH_LENGTH = 3;

// ============================================================================
// ADMIN CLIENT
// ============================================================================

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

// ============================================================================
// LEAD FETCHING
// ============================================================================

async function fetchLeadsChunk(
  supabase: ReturnType<typeof createAdminClient>,
  filters: ExportFilters,
  offset: number,
  limit: number
) {
  let query = supabase
    .from('leads')
    .select('*, assignee:profiles!leads_assigned_to_profiles_id_fk(id, display_name)')
    .is('deleted_at', null);

  // Apply search filter
  if (filters.search && filters.search.trim().length >= MIN_SEARCH_LENGTH) {
    const sanitized = sanitizeSearchTerm(filters.search);
    if (sanitized.length >= MIN_SEARCH_LENGTH) {
      const searchTerm = `%${sanitized}%`;
      query = query.or(
        `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},company.ilike.${searchTerm}`
      );
    }
  }

  // Apply status filter
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  // Apply assignee filter
  if (filters.assignedTo) {
    if (filters.assignedTo === 'unassigned') {
      query = query.is('assigned_to', null);
    } else {
      query = query.eq('assigned_to', filters.assignedTo);
    }
  }

  // Sort and paginate
  const sortColumn = isValidSortColumn(filters.sortBy) ? filters.sortBy : 'updated_at';
  const ascending = filters.sortOrder === 'asc';
  query = query
    .order(sortColumn, { ascending })
    .range(offset, offset + limit - 1);

  return query;
}

// ============================================================================
// MAIN WORKER
// ============================================================================

export interface ExportResult {
  success: boolean;
  totalRows: number;
  filePath: string;
  fileSizeBytes: number;
  processingTimeMs: number;
}

export async function handleExportDirectly(exportJobId: string): Promise<ExportResult> {
  const startTime = Date.now();
  const supabase = createAdminClient();

  console.log(`[ExportWorker] Starting export job: ${exportJobId}`);

  // 1. Get job from DB
  const { data: job, error: jobError } = await supabase
    .from('export_jobs')
    .select('*')
    .eq('id', exportJobId)
    .single();

  if (jobError || !job) {
    throw new Error(`Export job not found: ${exportJobId}`);
  }

  // 2. Update status to 'processing'
  await supabase
    .from('export_jobs')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
    })
    .eq('id', exportJobId);

  try {
    const filters: ExportFilters = job.filters || {};
    const limitRows = job.limit_rows;

    // 3. Generate CSV content
    const csvChunks: Uint8Array[] = [];
    csvChunks.push(UTF8_BOM);
    csvChunks.push(getCSVHeader());

    let offset = 0;
    let totalRows = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await fetchLeadsChunk(
        supabase,
        filters,
        offset,
        EXPORT_CHUNK_SIZE
      );

      if (error) {
        console.error('[ExportWorker] Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      // Add rows to CSV
      for (const lead of data) {
        const row = formatLeadForCSV(lead);
        csvChunks.push(encodeCSVRow(row));
        totalRows++;

        // Check limit
        if (limitRows && totalRows >= limitRows) {
          hasMore = false;
          break;
        }
      }

      // Update progress
      await supabase
        .from('export_jobs')
        .update({ processed_rows: totalRows })
        .eq('id', exportJobId);

      // Check if more data
      if (data.length < EXPORT_CHUNK_SIZE) {
        hasMore = false;
      } else {
        offset += EXPORT_CHUNK_SIZE;
      }

      // Break if limit reached
      if (limitRows && totalRows >= limitRows) {
        hasMore = false;
      }
    }

    // 4. Combine chunks and upload to Storage
    const totalLength = csvChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const csvBuffer = new Uint8Array(totalLength);
    let position = 0;
    for (const chunk of csvChunks) {
      csvBuffer.set(chunk, position);
      position += chunk.length;
    }

    const filePath = `${job.user_id}/${exportJobId}.csv`;

    const { error: uploadError } = await supabase.storage
      .from(EXPORT_BUCKET_NAME)
      .upload(filePath, csvBuffer, {
        contentType: 'text/csv',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload error: ${uploadError.message}`);
    }

    // 5. Update job as completed
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + EXPORT_FILE_EXPIRY_HOURS);

    await supabase
      .from('export_jobs')
      .update({
        status: 'completed',
        total_rows: totalRows,
        processed_rows: totalRows,
        file_path: filePath,
        file_size_bytes: csvBuffer.length,
        completed_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', exportJobId);

    const processingTimeMs = Date.now() - startTime;
    console.log(
      `[ExportWorker] Completed export job: ${exportJobId}, ` +
      `${totalRows} rows, ${csvBuffer.length} bytes, ${processingTimeMs}ms`
    );

    return {
      success: true,
      totalRows,
      filePath,
      fileSizeBytes: csvBuffer.length,
      processingTimeMs,
    };
  } catch (error) {
    // Update job as failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await supabase
      .from('export_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', exportJobId);

    console.error(`[ExportWorker] Failed export job: ${exportJobId}`, error);
    throw error;
  }
}
