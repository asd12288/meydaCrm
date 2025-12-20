/**
 * Auth utilities for profile fetching and role checking.
 * Handles the snake_case to camelCase conversion from Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseProfile, NormalizedProfile } from './types';
import { isAdminRole } from './types';

export { isAdminRole } from './types';
export type { SupabaseProfile, NormalizedProfile } from './types';

/**
 * Convert a Supabase profile (snake_case) to normalized profile (camelCase).
 */
export function normalizeProfile(
  supabaseProfile: SupabaseProfile
): NormalizedProfile {
  return {
    id: supabaseProfile.id,
    role: supabaseProfile.role,
    displayName: supabaseProfile.display_name,
    avatar: supabaseProfile.avatar,
    createdAt: new Date(supabaseProfile.created_at),
    updatedAt: new Date(supabaseProfile.updated_at),
  };
}

/**
 * Fetch and normalize a user's profile from Supabase.
 * Returns null if profile not found.
 */
export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<NormalizedProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('[Auth] Failed to fetch profile:', error?.message);
    return null;
  }

  // Debug log for development
  console.log('[Auth] Raw profile from Supabase:', JSON.stringify(data));

  const profile = normalizeProfile(data as SupabaseProfile);

  console.log('[Auth] Normalized profile:', JSON.stringify(profile));
  console.log('[Auth] User role:', profile.role, '| Is admin:', isAdminRole(profile.role));

  return profile;
}

/**
 * Check if a profile has admin role.
 */
export function isAdmin(profile: NormalizedProfile | null): boolean {
  if (!profile) return false;
  return isAdminRole(profile.role);
}

/**
 * Create a default profile for edge cases where profile doesn't exist.
 */
export function createDefaultProfile(
  userId: string,
  displayName: string
): NormalizedProfile {
  return {
    id: userId,
    role: 'sales',
    displayName,
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
