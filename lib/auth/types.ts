/**
 * Types for Supabase auth responses and profile data.
 * Supabase returns snake_case from Postgres, but our Drizzle types use camelCase.
 */

import type { UserRole } from '@/db/types';

/**
 * Raw profile response from Supabase (snake_case).
 * This matches what Postgres returns directly.
 */
export interface SupabaseProfile {
  id: string;
  role: UserRole;
  display_name: string;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Normalized profile (camelCase) for use in the app.
 * This matches the Drizzle Profile type.
 */
export interface NormalizedProfile {
  id: string;
  role: UserRole;
  displayName: string;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Check if a role is admin
 */
export function isAdminRole(role: UserRole | string): boolean {
  return role === 'admin';
}
