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
  passwordField: string,
  confirmField: string
) {
  return {
    validator: (data: Record<string, unknown>) =>
      data[passwordField] === data[confirmField],
    message: 'Les mots de passe ne correspondent pas',
    path: [confirmField],
  };
}
