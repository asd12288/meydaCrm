import type { UserRole } from '@/db/types';

// Note: ROLE_OPTIONS and ROLE_LABELS are centralized in @/lib/constants

// Role colors mapping to globals.css badge classes
export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'badge-primary',
  sales: 'badge-secondary',
  developer: 'badge-info',
};

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10];

// Table column labels (French)
export const COLUMN_LABELS = {
  displayName: 'Utilisateur',
  role: 'Role',
  lastLogin: 'Derniere connexion',
  createdAt: 'Cree le',
  actions: '',
} as const;
