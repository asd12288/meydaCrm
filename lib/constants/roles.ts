/**
 * Centralized role constants (DRY)
 * Used across: users, auth modules
 */

export const ROLES = {
  ADMIN: 'admin',
  SALES: 'sales',
  DEVELOPER: 'developer',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

/**
 * Role display labels in French
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  sales: 'Commercial',
  developer: 'Développeur',
};

/**
 * Role options for dropdowns/selects (all roles including developer)
 * Use USER_ROLE_OPTIONS for user-facing UI (excludes developer)
 */
export const ROLE_OPTIONS = [
  { value: ROLES.ADMIN, label: ROLE_LABELS.admin },
  { value: ROLES.SALES, label: ROLE_LABELS.sales },
  { value: ROLES.DEVELOPER, label: ROLE_LABELS.developer },
] as const;

/**
 * User-facing role options (excludes developer role)
 * Developer role is internal and only used for support tickets system
 */
export const USER_ROLE_OPTIONS = [
  { value: ROLES.ADMIN, label: ROLE_LABELS.admin },
  { value: ROLES.SALES, label: ROLE_LABELS.sales },
] as const;

/**
 * Get display label for a role
 */
export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role as UserRole] || role;
}
