/**
 * Error Report Generator
 *
 * Generates and downloads CSV reports of invalid import rows.
 * Can be called by QStash or directly by authenticated admins.
 */

import { createClient } from '@supabase/supabase-js';
import { createQStashHandler, type ErrorReportJobPayload } from '@/modules/import/lib/queue';

export const maxDuration = 60; // 1 minute should be enough for error reports
export const dynamic = 'force-dynamic';

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
 * Generate error report CSV
 */
async function handleErrorReport(payload: ErrorReportJobPayload): Promise<{
  success: boolean;
  reportPath: string;
  errorCount: number;
}> {
  const { importJobId } = payload;

  console.log(`[ErrorReport] Generating report for job ${importJobId}`);

  const supabase = createAdminClient();

  // Get the import job
  const { data: job, error: jobError } = await supabase
    .from('import_jobs')
    .select('file_name, invalid_rows')
    .eq('id', importJobId)
    .single();

  if (jobError || !job) {
    throw new Error(`Job not found: ${importJobId}`);
  }

  if (!job.invalid_rows || job.invalid_rows === 0) {
    throw new Error('No invalid rows to report');
  }

  // Fetch invalid rows
  const { data: invalidRows, error: rowsError } = await supabase
    .from('import_rows')
    .select('row_number, raw_data, validation_errors')
    .eq('import_job_id', importJobId)
    .eq('status', 'invalid')
    .order('row_number', { ascending: true });

  if (rowsError || !invalidRows) {
    throw new Error(`Failed to fetch invalid rows: ${rowsError?.message}`);
  }

  console.log(`[ErrorReport] Found ${invalidRows.length} invalid rows`);

  // Build CSV content
  const csvLines: string[] = [];

  // Determine all unique columns from raw data
  const allColumns = new Set<string>();
  for (const row of invalidRows) {
    const rawData = row.raw_data as Record<string, string>;
    Object.keys(rawData).forEach((col) => allColumns.add(col));
  }

  // CSV Header
  const headers = ['Ligne', 'Erreurs', ...Array.from(allColumns)];
  csvLines.push(headers.map((h) => escapeCsvValue(h)).join(','));

  // CSV Rows
  for (const row of invalidRows) {
    const rawData = row.raw_data as Record<string, string>;
    const errors = row.validation_errors as Record<string, string> | null;

    // Format errors
    const errorMessages = errors
      ? Object.entries(errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join('; ')
      : '';

    // Build row values
    const rowValues = [
      String(row.row_number),
      errorMessages,
      ...Array.from(allColumns).map((col) => rawData[col] || ''),
    ];

    csvLines.push(rowValues.map((v) => escapeCsvValue(v)).join(','));
  }

  const csvContent = csvLines.join('\n');

  // Upload to Supabase Storage
  const reportPath = `error-reports/${importJobId}.csv`;
  const { error: uploadError } = await supabase.storage
    .from('imports')
    .upload(reportPath, csvContent, {
      contentType: 'text/csv',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload error report: ${uploadError.message}`);
  }

  // Update import job with report path
  await supabase
    .from('import_jobs')
    .update({ error_report_path: reportPath })
    .eq('id', importJobId);

  console.log(`[ErrorReport] Report generated: ${reportPath}`);

  return {
    success: true,
    reportPath,
    errorCount: invalidRows.length,
  };
}

/**
 * Escape CSV value (handle quotes and commas)
 */
function escapeCsvValue(value: string): string {
  if (!value) return '""';

  const stringValue = String(value);

  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * POST handler - called by QStash or direct request
 */
export const POST = createQStashHandler<ErrorReportJobPayload>(handleErrorReport);

/**
 * GET handler - health check
 */
export async function GET() {
  return Response.json({
    status: 'ok',
    worker: 'error-report',
    maxDuration,
  });
}
