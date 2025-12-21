'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireDeveloper, requireAuth, getCurrentUser } from '@/modules/auth';
import { FR_MESSAGES } from '@/lib/errors';
import { z } from 'zod';

// Types
export type BannerType = 'info' | 'warning' | 'success' | 'announcement';
export type BannerTarget = 'all' | 'admin';

export interface SystemBanner {
  id: string;
  message: string;
  type: BannerType;
  target_audience: BannerTarget;
  is_active: boolean;
  is_dismissible: boolean;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined data
  creator?: {
    display_name: string;
  };
}

export interface BannerDismissal {
  id: string;
  banner_id: string;
  user_id: string;
  dismissed_at: string;
}

// Schemas
const createBannerSchema = z.object({
  message: z.string().min(1, 'Le message est requis').max(500, 'Le message est trop long'),
  type: z.enum(['info', 'warning', 'success', 'announcement']),
  target_audience: z.enum(['all', 'admin']),
  is_dismissible: z.boolean().default(true),
  expires_at: z.string().nullable().optional(),
});

const updateBannerSchema = createBannerSchema.partial().extend({
  id: z.string().uuid(),
});

/**
 * Create a new system banner
 * Developer only
 */
export async function createBanner(
  data: z.infer<typeof createBannerSchema>
): Promise<{ success: boolean; bannerId?: string; error?: string }> {
  await requireDeveloper();
  const supabase = await createClient();

  const validation = createBannerSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? 'Données invalides',
    };
  }

  const user = await getCurrentUser();
  if (!user?.profile) {
    return { success: false, error: FR_MESSAGES.UNAUTHENTICATED };
  }

  const { data: banner, error } = await supabase
    .from('system_banners')
    .insert({
      message: validation.data.message,
      type: validation.data.type,
      target_audience: validation.data.target_audience,
      is_dismissible: validation.data.is_dismissible,
      expires_at: validation.data.expires_at || null,
      created_by: user.profile.id,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating banner:', error);
    return { success: false, error: 'Erreur lors de la création de la bannière' };
  }

  revalidatePath('/support');
  revalidatePath('/dashboard');

  return { success: true, bannerId: banner.id };
}

/**
 * Update an existing banner
 * Developer only
 */
export async function updateBanner(
  data: z.infer<typeof updateBannerSchema>
): Promise<{ success: boolean; error?: string }> {
  await requireDeveloper();
  const supabase = await createClient();

  const validation = updateBannerSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? 'Données invalides',
    };
  }

  const { id, ...updateData } = validation.data;

  const { error } = await supabase
    .from('system_banners')
    .update({
      ...(updateData.message !== undefined && { message: updateData.message }),
      ...(updateData.type !== undefined && { type: updateData.type }),
      ...(updateData.target_audience !== undefined && { target_audience: updateData.target_audience }),
      ...(updateData.is_dismissible !== undefined && { is_dismissible: updateData.is_dismissible }),
      ...(updateData.expires_at !== undefined && { expires_at: updateData.expires_at || null }),
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating banner:', error);
    return { success: false, error: 'Erreur lors de la mise à jour de la bannière' };
  }

  revalidatePath('/support');
  revalidatePath('/dashboard');

  return { success: true };
}

/**
 * Toggle banner active status
 * Developer only
 */
export async function toggleBannerActive(
  bannerId: string
): Promise<{ success: boolean; isActive?: boolean; error?: string }> {
  await requireDeveloper();
  const supabase = await createClient();

  // First get current status
  const { data: banner, error: fetchError } = await supabase
    .from('system_banners')
    .select('is_active')
    .eq('id', bannerId)
    .single();

  if (fetchError || !banner) {
    return { success: false, error: 'Bannière non trouvée' };
  }

  const newStatus = !banner.is_active;

  const { error } = await supabase
    .from('system_banners')
    .update({ is_active: newStatus })
    .eq('id', bannerId);

  if (error) {
    console.error('Error toggling banner:', error);
    return { success: false, error: 'Erreur lors de la mise à jour' };
  }

  revalidatePath('/support');
  revalidatePath('/dashboard');

  return { success: true, isActive: newStatus };
}

/**
 * Delete a banner
 * Developer only
 */
export async function deleteBanner(
  bannerId: string
): Promise<{ success: boolean; error?: string }> {
  await requireDeveloper();
  const supabase = await createClient();

  const { error } = await supabase
    .from('system_banners')
    .delete()
    .eq('id', bannerId);

  if (error) {
    console.error('Error deleting banner:', error);
    return { success: false, error: 'Erreur lors de la suppression' };
  }

  revalidatePath('/support');
  revalidatePath('/dashboard');

  return { success: true };
}

/**
 * Get all banners for management (developer only)
 */
export async function getAllBanners(): Promise<{
  success: boolean;
  banners?: SystemBanner[];
  error?: string;
}> {
  await requireDeveloper();
  const supabase = await createClient();

  const { data: banners, error } = await supabase
    .from('system_banners')
    .select(`
      *,
      creator:profiles!created_by(display_name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching banners:', error);
    return { success: false, error: 'Erreur lors du chargement' };
  }

  return { success: true, banners: banners as SystemBanner[] };
}

/**
 * Get active banners for current user (filtered by role)
 * All authenticated users
 */
export async function getActiveBanners(): Promise<{
  success: boolean;
  banners?: SystemBanner[];
  error?: string;
}> {
  await requireAuth();
  const supabase = await createClient();

  // RLS handles filtering by target_audience and expiry
  // We just need to fetch what the user can see
  const { data: banners, error } = await supabase
    .from('system_banners')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active banners:', error);
    return { success: false, error: 'Erreur lors du chargement' };
  }

  return { success: true, banners: banners as SystemBanner[] };
}

/**
 * Get dismissed banner IDs for current user
 */
export async function getDismissedBannerIds(): Promise<{
  success: boolean;
  dismissedIds?: string[];
  error?: string;
}> {
  await requireAuth();
  const supabase = await createClient();

  const { data: dismissals, error } = await supabase
    .from('banner_dismissals')
    .select('banner_id');

  if (error) {
    console.error('Error fetching dismissals:', error);
    return { success: false, error: 'Erreur lors du chargement' };
  }

  return {
    success: true,
    dismissedIds: dismissals?.map((d) => d.banner_id) ?? [],
  };
}

/**
 * Dismiss a banner for the current user
 */
export async function dismissBanner(
  bannerId: string
): Promise<{ success: boolean; error?: string }> {
  await requireAuth();
  const supabase = await createClient();

  const user = await getCurrentUser();
  if (!user?.profile) {
    return { success: false, error: FR_MESSAGES.UNAUTHENTICATED };
  }

  // Check if banner exists and is dismissible
  const { data: banner, error: bannerError } = await supabase
    .from('system_banners')
    .select('is_dismissible')
    .eq('id', bannerId)
    .single();

  if (bannerError || !banner) {
    return { success: false, error: 'Bannière non trouvée' };
  }

  if (!banner.is_dismissible) {
    return { success: false, error: 'Cette bannière ne peut pas être masquée' };
  }

  // Insert dismissal (upsert to handle duplicates)
  const { error } = await supabase
    .from('banner_dismissals')
    .upsert(
      {
        banner_id: bannerId,
        user_id: user.profile.id,
      },
      {
        onConflict: 'banner_id,user_id',
      }
    );

  if (error) {
    console.error('Error dismissing banner:', error);
    return { success: false, error: 'Erreur lors du masquage' };
  }

  revalidatePath('/dashboard');

  return { success: true };
}
