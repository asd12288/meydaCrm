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
