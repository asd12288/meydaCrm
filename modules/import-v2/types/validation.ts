/**
 * Import V2 Validation Types
 *
 * Types for row validation results
 * (Separated to avoid circular imports)
 */

import type { LeadFieldKey } from '../../import/types/mapping';

// =============================================================================
// VALIDATION TYPES
// =============================================================================

/**
 * Validation error for a specific field
 */
export interface FieldValidationErrorV2 {
  /** Field that has the error */
  field: LeadFieldKey;
  /** Error message (French) */
  message: string;
  /** Original value that caused the error */
  value?: string;
}

/**
 * Validation warning (non-blocking)
 */
export interface FieldValidationWarningV2 {
  /** Field with the warning */
  field: LeadFieldKey;
  /** Warning message (French) */
  message: string;
  /** Original value */
  value?: string;
}

/**
 * Validation result for a single row
 */
export interface RowValidationResultV2 {
  /** Row number in file (1-based) */
  rowNumber: number;
  /** Whether the row is valid (can be imported) */
  isValid: boolean;
  /** Blocking validation errors */
  errors: FieldValidationErrorV2[];
  /** Non-blocking warnings */
  warnings: FieldValidationWarningV2[];
  /** Normalized data after validation transforms */
  normalizedData: Partial<Record<LeadFieldKey, string | null>>;
}
