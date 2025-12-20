import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const mappingSchema = z.object({
  columnMapping: z.object({
    mappings: z.array(
      z.object({
        sourceColumn: z.string(),
        sourceIndex: z.number(),
        targetField: z.string().nullable(),
        confidence: z.number(),
        isManual: z.boolean(),
        sampleValues: z.array(z.string()),
      })
    ),
    hasHeaderRow: z.boolean(),
    headerRowIndex: z.number(),
    encoding: z.string(),
    delimiter: z.string(),
    sheetName: z.string().optional(),
  }),
});

/**
 * PATCH /api/import/[id]/mapping
 * Save column mapping configuration for an import job
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

    // Check if job exists and user has access
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
        { error: 'Impossible de modifier le mapping pour ce job' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = mappingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Configuration de mapping invalide', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { columnMapping } = validation.data;

    // Update import job with column mapping
    const { error: updateError } = await supabase
      .from('import_jobs')
      .update({
        column_mapping: columnMapping,
        ui_state: {
          currentStep: 2,
          mappingConfirmed: true,
          optionsConfirmed: false,
          lastAccessedAt: new Date().toISOString(),
        },
      })
      .eq('id', importJobId);

    if (updateError) {
      console.error('Failed to update mapping:', updateError);
      return NextResponse.json(
        { error: 'Impossible de sauvegarder le mapping' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mapping route error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
