/**
 * Auth utility functions (non-server actions)
 * These can be used in both client and server components
 */

import type { AuthUser } from '../types';
import { ROLES } from '@/lib/constants';

/**
 * Check if a user is a developer
 */
export function isDeveloper(user: AuthUser | null): boolean {
  return user?.profile?.role === ROLES.DEVELOPER;
}

/**
 * Check if a user is an admin or developer
 */
export function isAdminOrDeveloper(user: AuthUser | null): boolean {
  return user?.profile?.role === ROLES.ADMIN || user?.profile?.role === ROLES.DEVELOPER;
}

/**
 * Check if a user is an admin
 */
export function isAdmin(user: AuthUser | null): boolean {
  return user?.profile?.role === ROLES.ADMIN;
}


