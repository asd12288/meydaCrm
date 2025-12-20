import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Client } from '@upstash/qstash';

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

/**
 * Get the callback URL for QStash webhooks
 */
function getCallbackUrl(path: string): string {
  // Use ngrok URL in development
  const baseUrl = process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  return `${baseUrl}${path}`;
}

/**
 * POST /api/import/[id]/start
 * Start the import process by queuing parse job to QStash
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

    // Check if job exists and is ready to start
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', importJobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job d\'import non trouve' }, { status: 404 });
    }

    // Check job is in a valid state to start
    if (!['pending', 'ready'].includes(job.status)) {
      return NextResponse.json(
        { error: `Impossible de demarrer: le job est en statut "${job.status}"` },
        { status: 400 }
      );
    }

    // Verify required configuration exists
    if (!job.column_mapping) {
      return NextResponse.json(
        { error: 'Le mapping des colonnes n\'est pas configure' },
        { status: 400 }
      );
    }

    // Update job status to queued
    const { error: updateError } = await supabase
      .from('import_jobs')
      .update({
        status: 'queued',
        started_at: new Date().toISOString(),
        ui_state: {
          currentStep: 5, // Progress step
          mappingConfirmed: true,
          optionsConfirmed: true,
          lastAccessedAt: new Date().toISOString(),
        },
      })
      .eq('id', importJobId);

    if (updateError) {
      console.error('Failed to update job status:', updateError);
      return NextResponse.json(
        { error: 'Impossible de mettre a jour le statut du job' },
        { status: 500 }
      );
    }

    // Queue the parse job to QStash
    const parseUrl = getCallbackUrl('/api/import/parse');

    try {
      const response = await qstash.publishJSON({
        url: parseUrl,
        body: {
          importJobId,
          startChunk: 0,
        },
        retries: 3,
        // 5 minute timeout for parse job
        timeout: '5m',
      });

      // Update job with worker ID
      await supabase
        .from('import_jobs')
        .update({
          worker_id: response.messageId,
        })
        .eq('id', importJobId);

      console.log(`[Start] Queued parse job for ${importJobId}, messageId: ${response.messageId}`);

      return NextResponse.json({
        success: true,
        importJobId,
        messageId: response.messageId,
      });
    } catch (qstashError) {
      console.error('QStash publish error:', qstashError);

      // Revert status on queue failure
      await supabase
        .from('import_jobs')
        .update({
          status: 'failed',
          error_message: 'Impossible de demarrer le traitement',
        })
        .eq('id', importJobId);

      return NextResponse.json(
        { error: 'Impossible de demarrer le traitement' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Start route error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
