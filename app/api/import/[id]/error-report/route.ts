import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * GET /api/import/[id]/error-report
 * Download error report CSV for an import job
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: importJobId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    // Check if job exists and has error report
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('id, file_name, error_report_path, invalid_rows')
      .eq('id', importJobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job d\'import non trouve' }, { status: 404 });
    }

    // If no error report path, generate CSV on-the-fly
    if (!job.error_report_path) {
      // Generate CSV directly from import_rows
      const csvContent = await generateErrorReportCsv(importJobId);

      if (!csvContent) {
        return NextResponse.json(
          { error: 'Aucune erreur a rapporter' },
          { status: 404 }
        );
      }

      const fileName = `erreurs_${job.file_name?.replace(/\.[^/.]+$/, '') || importJobId.slice(0, 8)}.csv`;

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    // Download from Storage
    const adminSupabase = createAdminSupabase();

    const { data: fileData, error: downloadError } = await adminSupabase.storage
      .from('imports')
      .download(job.error_report_path);

    if (downloadError || !fileData) {
      console.error('Failed to download error report:', downloadError);

      // Fallback: generate on-the-fly
      const csvContent = await generateErrorReportCsv(importJobId);

      if (!csvContent) {
        return NextResponse.json(
          { error: 'Rapport d\'erreurs non disponible' },
          { status: 404 }
        );
      }

      const fileName = `erreurs_${job.file_name?.replace(/\.[^/.]+$/, '') || importJobId.slice(0, 8)}.csv`;

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    const fileName = `erreurs_${job.file_name?.replace(/\.[^/.]+$/, '') || importJobId.slice(0, 8)}.csv`;

    return new Response(fileData, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error report download error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * Create admin Supabase client for Storage access
 */
function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createAdminClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Generate error report CSV on-the-fly from import_rows
 */
async function generateErrorReportCsv(importJobId: string): Promise<string | null> {
  const supabase = createAdminSupabase();

  // Fetch invalid rows
  const { data: invalidRows, error: rowsError } = await supabase
    .from('import_rows')
    .select('row_number, raw_data, validation_errors')
    .eq('import_job_id', importJobId)
    .eq('status', 'invalid')
    .order('row_number', { ascending: true });

  if (rowsError || !invalidRows || invalidRows.length === 0) {
    return null;
  }

  // Build CSV content
  const csvLines: string[] = [];

  // Determine all unique columns from raw data
  const allColumns = new Set<string>();
  for (const row of invalidRows) {
    const rawData = row.raw_data as Record<string, string>;
    if (rawData) {
      Object.keys(rawData).forEach((col) => allColumns.add(col));
    }
  }

  // CSV Header
  const headers = ['Ligne', 'Erreurs', ...Array.from(allColumns)];
  csvLines.push(headers.map((h) => escapeCsvValue(h)).join(','));

  // CSV Rows
  for (const row of invalidRows) {
    const rawData = (row.raw_data as Record<string, string>) || {};
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

  return csvLines.join('\n');
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
