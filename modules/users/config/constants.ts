import type { UserRole } from '@/db/types';

// Role options for dropdown
export const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'sales', label: 'Commercial' },
  { value: 'admin', label: 'Administrateur' },
];

// Role colors mapping to globals.css badge classes
export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'badge-primary',
  sales: 'badge-secondary',
};

// Table column labels (French)
export const COLUMN_LABELS = {
  displayName: 'Nom complet',
  role: 'Role',
  createdAt: 'Cree le',
  actions: '',
} as const;
