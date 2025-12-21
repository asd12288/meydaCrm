'use server';

/**
 * Export Server Actions
 *
 * Server-side actions for creating and managing export jobs.
 */

import { createClient } from '@/lib/supabase/server';
import { enqueueExportJob } from './queue';
import { EXPORT_BUCKET_NAME } from '../config/constants';
import type {
  ExportFilters,
  ExportJob,
  CreateExportResult,
  ExportCountResult,
  ExportDownloadResult,
} from '../types';

// ============================================================================
// CREATE EXPORT JOB
// ============================================================================

/**
 * Create a new export job and enqueue it for processing
 */
export async function createExportJob(
  filters: ExportFilters,
  limitRows?: number | null
): Promise<CreateExportResult> {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Non authentifié' };
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return { success: false, error: 'Accès non autorisé' };
    }

    // Get estimated count first
    const { count: estimatedRows } = await getLeadsCount(supabase, filters);

    // Create export job record
    const { data: job, error: insertError } = await supabase
      .from('export_jobs')
      .insert({
        user_id: user.id,
        status: 'pending',
        filters: filters as unknown as Record<string, unknown>,
        limit_rows: limitRows ?? null,
        estimated_rows: estimatedRows ?? null,
      })
      .select()
      .single();

    if (insertError || !job) {
      console.error('[Export] Failed to create job:', insertError);
      return { success: false, error: 'Erreur lors de la création de l\'export' };
    }

    // Enqueue the job for processing
    try {
      await enqueueExportJob({ exportJobId: job.id });
    } catch (queueError) {
      // If queueing fails, mark job as failed
      await supabase
        .from('export_jobs')
        .update({
          status: 'failed',
          error_message: 'Erreur lors de la mise en file d\'attente',
        })
        .eq('id', job.id);

      console.error('[Export] Failed to enqueue job:', queueError);
      return { success: false, error: 'Erreur lors de la mise en file d\'attente' };
    }

    return { success: true, exportJobId: job.id };
  } catch (error) {
    console.error('[Export] Unexpected error:', error);
    return { success: false, error: 'Erreur inattendue' };
  }
}

// ============================================================================
// GET EXPORT JOB
// ============================================================================

/**
 * Get a single export job by ID
 */
export async function getExportJob(jobId: string): Promise<{ job: ExportJob | null; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: job, error } = await supabase
      .from('export_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      return { job: null, error: 'Export non trouvé' };
    }

    return { job: job as ExportJob };
  } catch (error) {
    console.error('[Export] Failed to get job:', error);
    return { job: null, error: 'Erreur inattendue' };
  }
}

// ============================================================================
// GET EXPORT JOBS LIST
// ============================================================================

/**
 * Get user's recent export jobs
 */
export async function getExportJobs(limit = 10): Promise<{ jobs: ExportJob[]; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: jobs, error } = await supabase
      .from('export_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { jobs: [], error: 'Erreur lors du chargement des exports' };
    }

    return { jobs: (jobs || []) as ExportJob[] };
  } catch (error) {
    console.error('[Export] Failed to get jobs:', error);
    return { jobs: [], error: 'Erreur inattendue' };
  }
}

// ============================================================================
// GET EXPORT COUNT
// ============================================================================

/**
 * Get count of leads matching filters (for modal preview)
 */
export async function getExportCount(filters: ExportFilters): Promise<ExportCountResult> {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { count: 0, error: 'Non authentifié' };
    }

    const { count, error } = await getLeadsCount(supabase, filters);

    if (error) {
      return { count: 0, error: 'Erreur lors du comptage' };
    }

    return { count: count ?? 0 };
  } catch (error) {
    console.error('[Export] Failed to get count:', error);
    return { count: 0, error: 'Erreur inattendue' };
  }
}

// ============================================================================
// GET DOWNLOAD URL
// ============================================================================

/**
 * Get signed download URL for completed export
 */
export async function getExportDownloadUrl(jobId: string): Promise<ExportDownloadResult> {
  try {
    const supabase = await createClient();

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('export_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return { url: null, error: 'Export non trouvé' };
    }

    if (job.status !== 'completed') {
      return { url: null, error: 'Export non terminé' };
    }

    if (!job.file_path) {
      return { url: null, error: 'Fichier non disponible' };
    }

    // Check expiration
    if (job.expires_at && new Date(job.expires_at) < new Date()) {
      return { url: null, error: 'Export expiré' };
    }

    // Generate signed URL (1 hour validity)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(EXPORT_BUCKET_NAME)
      .createSignedUrl(job.file_path, 3600);

    if (urlError || !urlData) {
      console.error('[Export] Failed to create signed URL:', urlError);
      return { url: null, error: 'Erreur lors de la génération du lien' };
    }

    return { url: urlData.signedUrl };
  } catch (error) {
    console.error('[Export] Failed to get download URL:', error);
    return { url: null, error: 'Erreur inattendue' };
  }
}

// ============================================================================
// HELPER: Get leads count with filters
// ============================================================================

async function getLeadsCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: ExportFilters
): Promise<{ count: number | null; error?: string }> {
  let query = supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  // Apply search filter
  if (filters.search && filters.search.trim().length >= 3) {
    const searchTerm = `%${filters.search.trim()}%`;
    query = query.or(
      `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},company.ilike.${searchTerm}`
    );
  }

  // Apply status filter
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  // Apply assignee filter
  if (filters.assignedTo) {
    if (filters.assignedTo === 'unassigned') {
      query = query.is('assigned_to', null);
    } else {
      query = query.eq('assigned_to', filters.assignedTo);
    }
  }

  const { count, error } = await query;

  if (error) {
    console.error('[Export] Count query error:', error);
    return { count: null, error: error.message };
  }

  return { count };
}
