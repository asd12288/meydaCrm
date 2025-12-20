/**
 * Resume Import Commit
 *
 * Manual endpoint to resume a stalled commit for large imports.
 * The commit worker will pick up where it left off (only processes 'valid' rows).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { handleCommitDirectly } from '@/modules/import/workers';
import type { AssignmentConfig, DuplicateConfig } from '@/modules/import/types';

export const maxDuration = 300; // 5 minutes max
export const dynamic = 'force-dynamic';

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: importJobId } = await params;

  console.log(`[Resume] Starting resume for job ${importJobId}`);

  const supabase = createAdminClient();

  // Get the job
  const { data: job, error: jobError } = await supabase
    .from('import_jobs')
    .select('*')
    .eq('id', importJobId)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Check if job can be resumed
  if (job.status === 'completed') {
    return NextResponse.json({ message: 'Job already completed', job });
  }

  if (job.status === 'failed' || job.status === 'cancelled') {
    return NextResponse.json({ error: `Job is ${job.status}` }, { status: 400 });
  }

  // Count remaining valid rows
  const { count: remainingCount } = await supabase
    .from('import_rows')
    .select('*', { count: 'exact', head: true })
    .eq('import_job_id', importJobId)
    .eq('status', 'valid');

  console.log(`[Resume] Remaining valid rows: ${remainingCount}`);

  if (!remainingCount || remainingCount === 0) {
    // No more rows to process - mark as completed
    await supabase
      .from('import_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', importJobId);

    return NextResponse.json({ message: 'No remaining rows, marked as completed' });
  }

  // Get configs from job
  const assignmentConfig = (job.assignment_config as AssignmentConfig) || { mode: 'none' };
  const duplicateConfig = (job.duplicate_config as DuplicateConfig) || {
    strategy: 'skip',
    checkFields: ['email'],
    checkDatabase: true,
    checkWithinFile: true,
  };

  // Reset status to 'importing' if needed
  if (job.status !== 'importing') {
    await supabase
      .from('import_jobs')
      .update({ status: 'importing' })
      .eq('id', importJobId);
  }

  try {
    // Run commit worker (will process next batch)
    const result = await handleCommitDirectly(
      importJobId,
      assignmentConfig,
      duplicateConfig,
      'new',
      `Import ${job.file_name}`
    );

    return NextResponse.json({
      success: true,
      result,
      remainingBefore: remainingCount,
    });
  } catch (error) {
    console.error('[Resume] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: importJobId } = await params;

  const supabase = createAdminClient();

  // Get job status
  const { data: job } = await supabase
    .from('import_jobs')
    .select('id, status, file_name, total_rows, valid_rows, imported_rows, skipped_rows')
    .eq('id', importJobId)
    .single();

  // Count remaining
  const { count: remainingCount } = await supabase
    .from('import_rows')
    .select('*', { count: 'exact', head: true })
    .eq('import_job_id', importJobId)
    .eq('status', 'valid');

  return NextResponse.json({
    job,
    remainingValidRows: remainingCount,
  });
}
