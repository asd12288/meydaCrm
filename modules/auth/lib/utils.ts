/**
 * Auth utility functions (non-server actions)
 * These can be used in both client and server components
 */

import type { AuthUser } from '../types';

/**
 * Check if a user is a developer
 */
export function isDeveloper(user: AuthUser | null): boolean {
  return user?.profile?.role === 'developer';
}

/**
 * Check if a user is an admin or developer
 */
export function isAdminOrDeveloper(user: AuthUser | null): boolean {
  return user?.profile?.role === 'admin' || user?.profile?.role === 'developer';
}

/**
 * Check if a user is an admin
 */
export function isAdmin(user: AuthUser | null): boolean {
  return user?.profile?.role === 'admin';
}
