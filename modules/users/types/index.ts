import { z } from 'zod';
import type { UserRole } from '@/db/types';

// Re-export centralized schemas from lib/validation
export {
  createUserSchema,
  resetPasswordSchema,
  editUserSchema,
  type CreateUserInput,
  type ResetPasswordInput,
  type EditUserInput,
} from '@/lib/validation';

// User filter schema for URL params validation
export const userFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(10).max(10).default(10),
  search: z.string().optional(),
  role: z.string().optional(),
  sortBy: z
    .enum(['created_at', 'updated_at', 'display_name', 'last_sign_in_at'])
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type UserFilters = z.infer<typeof userFiltersSchema>;

// User profile from database (with auth data)
export interface UserProfile {
  id: string;
  role: UserRole;
  display_name: string;
  avatar: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  email: string | null;
}

// Paginated response from getUsers
export interface PaginatedUsersResponse {
  users: UserProfile[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form field labels in French
export const USER_FIELD_LABELS = {
  username: 'Identifiant',
  displayName: 'Nom complet',
  password: 'Mot de passe',
  confirmPassword: 'Confirmer le mot de passe',
  newPassword: 'Nouveau mot de passe',
  role: 'Role',
} as const;

// Note: ROLE_LABELS is centralized in @/lib/constants

// Re-export for convenience
export type { UserRole };
