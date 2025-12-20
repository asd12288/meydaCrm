/**
 * Centralized role constants (DRY)
 * Used across: users, auth modules
 */

export const ROLES = {
  ADMIN: 'admin',
  SALES: 'sales',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

/**
 * Role display labels in French
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  sales: 'Commercial',
};

/**
 * Role options for dropdowns/selects
 */
export const ROLE_OPTIONS = [
  { value: ROLES.ADMIN, label: ROLE_LABELS.admin },
  { value: ROLES.SALES, label: ROLE_LABELS.sales },
] as const;

/**
 * Get display label for a role
 */
export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role as UserRole] || role;
}
