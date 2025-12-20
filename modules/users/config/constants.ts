import type { UserRole } from '@/db/types';

// Note: ROLE_OPTIONS and ROLE_LABELS are centralized in @/lib/constants

// Role colors mapping to globals.css badge classes
export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'badge-primary',
  sales: 'badge-secondary',
};

// Table column labels (French)
export const COLUMN_LABELS = {
  displayName: 'Utilisateur',
  role: 'Role',
  lastLogin: 'Derniere connexion',
  createdAt: 'Cree le',
  actions: '',
} as const;
