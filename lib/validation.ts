import { z } from 'zod';

// Type for safeParse result
type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: { issues: Array<{ message: string }> } };

/**
 * Extract the first validation error message from a Zod parse result
 * Reduces duplication across action files
 */
export function extractValidationError<T>(
  result: SafeParseResult<T>,
  defaultMessage = 'Données invalides'
): string {
  if (result.success) return '';
  return result.error.issues[0]?.message || defaultMessage;
}

/**
 * Validate data with a Zod schema and return a standardized result
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  defaultMessage = 'Données invalides'
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    error: extractValidationError(result, defaultMessage),
  };
}

// ============================================
// Reusable Zod Schemas (DRY)
// ============================================

/**
 * Password schema with French error messages
 * Used across: auth, users, account modules
 */
export const passwordSchema = z
  .string()
  .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
  .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères');

/**
 * Display name schema with French error messages
 * Used across: users, account modules
 */
export const displayNameSchema = z
  .string()
  .min(2, 'Le nom doit contenir au moins 2 caractères')
  .max(100, 'Le nom ne peut pas dépasser 100 caractères');

/**
 * Email schema with French error messages
 * Used across: leads, import modules
 */
export const emailSchema = z
  .string()
  .email('Email invalide')
  .max(255, 'Email trop long (max 255 caractères)')
  .optional()
  .nullable()
  .or(z.literal(''));

/**
 * Role enum for user roles
 */
export const roleEnum = z.enum(['admin', 'sales'] as const);
export type UserRole = z.infer<typeof roleEnum>;

/**
 * Helper to create a password confirmation refine
 */
export function createPasswordConfirmRefine(
  passwordField: string = 'newPassword',
  confirmField: string = 'confirmPassword'
) {
  return {
    validator: (data: Record<string, unknown>) =>
      data[passwordField] === data[confirmField],
    message: 'Les mots de passe ne correspondent pas',
    path: [confirmField],
  };
}

// ============================================
// Username Schema
// ============================================

/**
 * Username schema with French error messages
 * Used in: users module (create user)
 */
export const usernameSchema = z
  .string()
  .min(3, 'Minimum 3 caractères')
  .max(50, 'Maximum 50 caractères')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Caractères autorisés: lettres, chiffres, . _ -');

// ============================================
// Composite Schemas (DRY)
// ============================================

/**
 * Change password schema - for users changing their own password
 * Used in: account module
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Veuillez confirmer le mot de passe'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Reset password schema - for admin resetting user passwords
 * Used in: users module
 */
export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Create user schema - for admin creating new users
 * Used in: users module
 */
export const createUserSchema = z
  .object({
    username: usernameSchema,
    displayName: displayNameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    role: roleEnum,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Edit user schema - for admin editing user profile
 * Used in: users module
 */
export const editUserSchema = z.object({
  displayName: displayNameSchema,
  role: roleEnum,
});

export type EditUserInput = z.infer<typeof editUserSchema>;

/**
 * Update profile schema - for users editing their own profile
 * Used in: account module
 */
export const updateProfileSchema = z.object({
  displayName: displayNameSchema,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
