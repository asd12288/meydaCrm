import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/import/[id]/cancel
 * Cancel a running import job
 */
export async function POST(
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

    // Check if job exists
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('id, status, worker_id')
      .eq('id', importJobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job d\'import non trouve' }, { status: 404 });
    }

    // Check if job can be cancelled
    const cancellableStatuses = ['pending', 'queued', 'parsing', 'validating', 'ready', 'importing'];
    if (!cancellableStatuses.includes(job.status)) {
      return NextResponse.json(
        { error: `Impossible d'annuler: le job est en statut "${job.status}"` },
        { status: 400 }
      );
    }

    // Update job status to cancelled
    const { error: updateError } = await supabase
      .from('import_jobs')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        error_message: 'Annule par l\'utilisateur',
      })
      .eq('id', importJobId);

    if (updateError) {
      console.error('Failed to cancel job:', updateError);
      return NextResponse.json(
        { error: 'Impossible d\'annuler le job' },
        { status: 500 }
      );
    }

    // Note: QStash doesn't support message cancellation directly
    // The worker will check the job status and abort if cancelled

    console.log(`[Cancel] Job ${importJobId} cancelled`);

    return NextResponse.json({
      success: true,
      importJobId,
      message: 'Import annule',
    });
  } catch (error) {
    console.error('Cancel route error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
