import { z } from 'zod';
import type { UserRole } from '@/db/types';

// Create user form schema
export const createUserSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Minimum 3 caracteres')
      .max(50, 'Maximum 50 caracteres')
      .regex(
        /^[a-zA-Z0-9._-]+$/,
        'Caracteres autorises: lettres, chiffres, . _ -'
      ),
    displayName: z
      .string()
      .min(2, 'Minimum 2 caracteres')
      .max(100, 'Maximum 100 caracteres'),
    password: z
      .string()
      .min(6, 'Minimum 6 caracteres')
      .max(100, 'Maximum 100 caracteres'),
    confirmPassword: z.string(),
    role: z.enum(['admin', 'sales'] as const),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;

// Reset password form schema
export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, 'Minimum 6 caracteres')
      .max(100, 'Maximum 100 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

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

// Edit user form schema
export const editUserSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Minimum 2 caracteres')
    .max(100, 'Maximum 100 caracteres'),
  role: z.enum(['admin', 'sales'] as const),
});

export type EditUserInput = z.infer<typeof editUserSchema>;

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
