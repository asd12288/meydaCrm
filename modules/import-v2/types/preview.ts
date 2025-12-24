/**
 * Import V2 Preview Types
 *
 * Types for the preview step with duplicate detection and comparison
 */

import type { LeadFieldKey } from '../../import/types/mapping';
import type { DuplicateCheckField, UnifiedRowAction } from '../config/constants';
import type { RowValidationResultV2 } from './validation';

// Note: ErrorRowAction has been replaced by UnifiedRowAction from constants.ts
// The unified system uses 'skip' | 'import' | 'update' for all issue types

// =============================================================================
// PREVIEW ROW TYPES
// =============================================================================

// Note: PreviewIssueType is defined in config/constants.ts (not here)

/**
 * Base interface for all preview rows
 */
export interface PreviewRowBaseV2 {
  /** Row number in file (1-based) */
  rowNumber: number;
  /** Key data for display */
  displayData: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    company?: string | null;
    externalId?: string | null;
  };
}

/**
 * Invalid row (validation errors)
 */
export interface InvalidRowV2 extends PreviewRowBaseV2 {
  issueType: 'invalid';
  /** Validation result for this row (contains full normalizedData) */
  validationResult?: RowValidationResultV2;
  /** Validation errors by field */
  errors: Array<{
    field: LeadFieldKey;
    message: string;
    value?: string;
  }>;
  /** Validation warnings */
  warnings?: Array<{
    field: LeadFieldKey;
    message: string;
    value?: string;
  }>;
}

/**
 * File duplicate row (duplicate within file)
 */
export interface FileDuplicateRowV2 extends PreviewRowBaseV2 {
  issueType: 'file_duplicate';
  /** Validation result for this row */
  validationResult: RowValidationResultV2;
  /** Field that matched */
  matchedField: DuplicateCheckField;
  /** Value that matched */
  matchedValue: string;
  /** Row number of the first occurrence */
  firstOccurrenceRow?: number;
  /** Whether this is the first occurrence */
  isFirstOccurrence: boolean;
}

/**
 * Group of file duplicates with the same matching value
 */
export interface FileDuplicateGroupV2 {
  /** Unique group identifier */
  id: string;
  /** Field that matched */
  matchedField: DuplicateCheckField;
  /** Value that matched */
  matchedValue: string;
  /** All rows in this group */
  rows: FileDuplicateRowV2[];
  /** Count of rows in group */
  count: number;
}

/**
 * Database duplicate row (matches existing lead)
 */
export interface DbDuplicateRowV2 extends PreviewRowBaseV2 {
  issueType: 'db_duplicate';
  /** Field that matched */
  matchedField: DuplicateCheckField;
  /** Value that matched */
  matchedValue: string;
  /** Existing lead data for comparison */
  existingLead: ExistingLeadDataV2;
  /** Fields that are different between file and existing */
  changedFields: LeadFieldKey[];
  /** Per-row action override (if set) */
  rowAction?: UnifiedRowAction;
}

/**
 * Existing lead data for comparison
 */
export interface ExistingLeadDataV2 {
  /** Lead UUID */
  id: string;
  /** Email */
  email?: string | null;
  /** Phone */
  phone?: string | null;
  /** First name */
  firstName?: string | null;
  /** Last name */
  lastName?: string | null;
  /** Company */
  company?: string | null;
  /** Job title */
  jobTitle?: string | null;
  /** External ID */
  externalId?: string | null;
  /** Current status */
  status?: string | null;
  /** Status label (French) */
  statusLabel?: string | null;
  /** Assigned to user ID */
  assignedTo?: string | null;
  /** Assigned user name */
  assignedToName?: string | null;
  /** Creation date */
  createdAt: string;
  /** Last update date */
  updatedAt: string;
}

/**
 * Union type for all preview issue rows
 */
export type PreviewIssueRowV2 = InvalidRowV2 | FileDuplicateRowV2 | DbDuplicateRowV2;

// =============================================================================
// PREVIEW SUMMARY
// =============================================================================

/**
 * Summary counts for the preview
 */
export interface PreviewSummaryV2 {
  /** Total rows in file */
  total: number;
  /** Valid rows (will be imported as new) */
  valid: number;
  /** Invalid rows (validation errors) */
  invalid: number;
  /** File duplicates (within-file) */
  fileDuplicates: number;
  /** Database duplicates (existing leads) */
  dbDuplicates: number;
}

/**
 * Effective counts considering per-row actions
 */
export interface EffectiveCountsV2 {
  /** Will be imported as new leads */
  willImport: number;
  /** Will update existing leads */
  willUpdate: number;
  /** Will be skipped */
  willSkip: number;
  /** Will fail (validation errors) */
  willError: number;
}

// =============================================================================
// ASSIGNMENT PREVIEW
// =============================================================================

/**
 * Preview of how leads will be distributed
 */
export interface AssignmentPreviewV2 {
  /** Distribution by user (for round-robin) */
  distribution: Array<{
    userId: string;
    userName: string;
    userAvatar?: string | null;
    assignedCount: number;
    percentage: number;
  }>;
  /** Unassigned count (if mode is 'none' or by_column with no match) */
  unassignedCount: number;
}

// =============================================================================
// COMPLETE PREVIEW DATA
// =============================================================================

/**
 * Complete preview data for Step 2
 */
export interface DetailedPreviewDataV2 {
  /** Summary counts */
  summary: PreviewSummaryV2;

  /** Effective counts considering row actions */
  effectiveCounts: EffectiveCountsV2;

  /** Invalid rows with error details */
  invalidRows: InvalidRowV2[];

  /** File duplicate rows */
  fileDuplicateRows: FileDuplicateRowV2[];

  /** Database duplicate rows with existing lead comparison */
  dbDuplicateRows: DbDuplicateRowV2[];

  /** Assignment preview (how leads will be distributed) */
  assignmentPreview?: AssignmentPreviewV2;

  /** Import job status (to detect completed jobs) */
  jobStatus?: string;
}

// =============================================================================
// COMPARISON MODAL DATA
// =============================================================================

/**
 * Data for the side-by-side comparison modal
 */
export interface ComparisonDataV2 {
  /** Row number from file */
  rowNumber: number;

  /** File data */
  fileData: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    company?: string | null;
    jobTitle?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    country?: string | null;
    status?: string | null;
    source?: string | null;
    notes?: string | null;
  };

  /** Existing lead data */
  existingData: ExistingLeadDataV2;

  /** Fields that are different */
  changedFields: LeadFieldKey[];

  /** Current row action */
  rowAction: UnifiedRowAction;

  /** Field that caused the duplicate match */
  matchedField: DuplicateCheckField;

  /** Value that matched */
  matchedValue: string;
}

// =============================================================================
// TAB CONFIGURATION
// =============================================================================

/**
 * Preview tab identifiers
 */
export type PreviewTabV2 = 'invalid' | 'file_duplicates' | 'db_duplicates';
