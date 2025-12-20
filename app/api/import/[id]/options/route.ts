import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const optionsSchema = z.object({
  assignmentConfig: z.object({
    mode: z.enum(['none', 'single', 'round_robin', 'by_column']),
    singleUserId: z.string().uuid().optional(),
    roundRobinUserIds: z.array(z.string().uuid()).optional(),
    assignmentColumn: z.string().optional(),
  }),
  duplicateConfig: z.object({
    strategy: z.enum(['skip', 'update', 'create']),
    checkFields: z.array(z.enum(['email', 'phone', 'external_id'])),
    checkDatabase: z.boolean(),
    checkWithinFile: z.boolean(),
  }),
});

/**
 * PATCH /api/import/[id]/options
 * Save assignment and duplicate configuration for an import job
 */
export async function PATCH(
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
      .select('id, status, created_by')
      .eq('id', importJobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job d\'import non trouve' }, { status: 404 });
    }

    // Only allow updating jobs in pending/ready state
    if (!['pending', 'ready'].includes(job.status)) {
      return NextResponse.json(
        { error: 'Impossible de modifier les options pour ce job' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = optionsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Configuration invalide', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { assignmentConfig, duplicateConfig } = validation.data;

    // Validate assignment config
    if (assignmentConfig.mode === 'single' && !assignmentConfig.singleUserId) {
      return NextResponse.json(
        { error: 'Un commercial doit etre selectionne' },
        { status: 400 }
      );
    }

    if (
      assignmentConfig.mode === 'round_robin' &&
      (!assignmentConfig.roundRobinUserIds || assignmentConfig.roundRobinUserIds.length < 2)
    ) {
      return NextResponse.json(
        { error: 'Au moins 2 commerciaux doivent etre selectionnes' },
        { status: 400 }
      );
    }

    // Update import job with options
    const { error: updateError } = await supabase
      .from('import_jobs')
      .update({
        assignment_config: assignmentConfig,
        duplicate_config: duplicateConfig,
        ui_state: {
          currentStep: 3,
          mappingConfirmed: true,
          optionsConfirmed: true,
          lastAccessedAt: new Date().toISOString(),
        },
      })
      .eq('id', importJobId);

    if (updateError) {
      console.error('Failed to update options:', updateError);
      return NextResponse.json(
        { error: 'Impossible de sauvegarder les options' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Options route error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
