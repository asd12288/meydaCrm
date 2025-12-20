import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/import/[id]
 * Fetch import job details for resuming
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

    // Fetch job with all details
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', importJobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job d\'import non trouve' }, { status: 404 });
    }

    // Check if user has access (admin or creator)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && job.created_by !== user.id) {
      return NextResponse.json({ error: 'Acces non autorise' }, { status: 403 });
    }

    // Return full job details for resuming
    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        fileName: job.file_name,
        fileType: job.file_type,
        storagePath: job.storage_path,
        totalRows: job.total_rows,
        processedRows: job.processed_rows,
        validRows: job.valid_rows,
        invalidRows: job.invalid_rows,
        importedRows: job.imported_rows,
        skippedRows: job.skipped_rows,
        columnMapping: job.column_mapping,
        assignmentConfig: job.assignment_config,
        duplicateConfig: job.duplicate_config,
        uiState: job.ui_state,
        errorMessage: job.error_message,
        createdAt: job.created_at,
        startedAt: job.started_at,
        completedAt: job.completed_at,
      },
    });
  } catch (error) {
    console.error('Get import job error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
