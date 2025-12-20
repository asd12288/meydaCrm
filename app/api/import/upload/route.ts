import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const uploadSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.enum(['csv', 'xlsx', 'xls']),
  fileSize: z.number().max(50 * 1024 * 1024, 'Fichier trop volumineux (max 50 MB)'),
  fileHash: z.string().optional(),
});

/**
 * POST /api/import/upload
 * Creates an import job and returns a signed upload URL for direct storage upload
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acces non autorise' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = uploadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { fileName, fileType, fileHash } = validation.data;

    // Check for duplicate file hash (if provided)
    if (fileHash) {
      const { data: existingJob } = await supabase.rpc('check_duplicate_import', {
        p_file_hash: fileHash,
      });

      if (existingJob && existingJob.length > 0) {
        return NextResponse.json(
          {
            error: 'Ce fichier a deja ete importe',
            existingJobId: existingJob[0].job_id,
            existingStatus: existingJob[0].status,
          },
          { status: 409 }
        );
      }
    }

    // Generate storage path
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `imports/${user.id}/${timestamp}_${sanitizedFileName}`;

    // Create import job
    const { data: importJob, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        created_by: user.id,
        file_name: fileName,
        file_type: fileType,
        storage_path: storagePath,
        file_hash: fileHash || null,
        status: 'pending',
        ui_state: {
          currentStep: 1,
          mappingConfirmed: false,
          optionsConfirmed: false,
          lastAccessedAt: new Date().toISOString(),
        },
      })
      .select('id, status, created_at')
      .single();

    if (jobError) {
      console.error('Failed to create import job:', jobError);
      return NextResponse.json(
        { error: 'Impossible de creer le job d\'import' },
        { status: 500 }
      );
    }

    // Create signed upload URL for direct browser upload
    const { data: signedUrl, error: signedUrlError } = await supabase.storage
      .from('imports')
      .createSignedUploadUrl(storagePath);

    if (signedUrlError) {
      console.error('Failed to create signed URL:', signedUrlError);
      // Clean up the import job
      await supabase.from('import_jobs').delete().eq('id', importJob.id);
      return NextResponse.json(
        { error: 'Impossible de generer l\'URL de telechargement' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      importJobId: importJob.id,
      uploadUrl: signedUrl.signedUrl,
      uploadToken: signedUrl.token,
      storagePath,
    });
  } catch (error) {
    console.error('Upload route error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
