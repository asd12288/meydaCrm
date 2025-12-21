/**
 * Export Download Route
 *
 * Redirects to signed URL for export file download.
 * Verifies ownership and expiration before redirecting.
 */

import { createClient } from '@/lib/supabase/server';
import { EXPORT_BUCKET_NAME } from '@/modules/export/config/constants';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response('Non authentifié', { status: 401 });
    }

    // Get job details (RLS will enforce ownership)
    const { data: job, error: jobError } = await supabase
      .from('export_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (jobError || !job) {
      return new Response('Export non trouvé', { status: 404 });
    }

    if (job.status !== 'completed') {
      return new Response('Export non terminé', { status: 400 });
    }

    if (!job.file_path) {
      return new Response('Fichier non disponible', { status: 404 });
    }

    // Check expiration
    if (job.expires_at && new Date(job.expires_at) < new Date()) {
      return new Response('Export expiré', { status: 410 });
    }

    // Generate signed URL (1 hour validity)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(EXPORT_BUCKET_NAME)
      .createSignedUrl(job.file_path, 3600);

    if (urlError || !urlData) {
      console.error('[Export] Failed to create signed URL:', urlError);
      return new Response('Erreur lors de la génération du lien', { status: 500 });
    }

    // Redirect to signed URL
    return Response.redirect(urlData.signedUrl, 302);
  } catch (error) {
    console.error('[Export] Download error:', error);
    return new Response('Erreur serveur', { status: 500 });
  }
}
