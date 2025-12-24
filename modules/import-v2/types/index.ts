/**
 * Import V2 Types
 *
 * Core type definitions for the new import system
 */

// Re-export from sub-modules
export * from './validation';
export * from './wizard';
export * from './preview';

// Re-export LeadFieldKey from v1 for consistency
export type { LeadFieldKey } from '../../import/types/mapping';

// Re-export schemas from v1 that we reuse
export {
  emailSchema,
  phoneSchema,
  postalCodeSchema,
  importRowDataSchema,
  hasContactInfoSchema,
  type ImportRowData,
} from '../../import/types';

// =============================================================================
// COLUMN MAPPING TYPES (Enhanced from V1)
// =============================================================================

import type { LeadFieldKey } from '../../import/types/mapping';

/**
 * Mapping of a single file column to a lead field
 */
export interface ColumnMappingV2 {
  /** Original column header from the file */
  sourceColumn: string;
  /** Index of the column in the file (0-based) */
  sourceIndex: number;
  /** Target lead field (null = ignore this column) */
  targetField: LeadFieldKey | null;
  /** Confidence score of auto-mapping (0-1) */
  confidence: number;
  /** Whether this was manually set by user */
  isManual: boolean;
  /** Sample values from the file for preview */
  sampleValues: string[];
}

/**
 * Complete column mapping configuration
 */
export interface ColumnMappingConfigV2 {
  /** All column mappings */
  mappings: ColumnMappingV2[];
  /** Whether header row was detected */
  hasHeaderRow: boolean;
  /** Row number of header (0-based) */
  headerRowIndex: number;
  /** File encoding detected */
  encoding: string;
  /** Delimiter detected (for CSV) */
  delimiter: string;
  /** Sheet name (for Excel files) */
  sheetName?: string;
}

// =============================================================================
// PARSED FILE TYPES
// =============================================================================

/**
 * File type
 */
export type FileType = 'csv' | 'xlsx' | 'xls';

/**
 * Information about an uploaded/parsed file
 */
export interface ParsedFileV2 {
  /** Original file name */
  name: string;
  /** File size in bytes */
  size: number;
  /** File type */
  type: FileType;
  /** Column headers from the file */
  headers: string[];
  /** Total row count (excluding header) */
  rowCount: number;
  /** Raw parsed rows */
  rows: ParsedRowV2[];
  /** Available sheets (for Excel files) */
  sheets?: string[];
  /** Selected sheet name */
  selectedSheet?: string;
}

/**
 * A single parsed row from the file
 */
export interface ParsedRowV2 {
  /** Row number in file (1-based for display) */
  rowNumber: number;
  /** Raw values by column index */
  values: string[];
  /** Mapped data after applying column mapping */
  mappedData?: Partial<Record<LeadFieldKey, string | null>>;
}

// =============================================================================
// ASSIGNMENT TYPES
// =============================================================================

import type { AssignmentModeV2 } from '../config/constants';

/**
 * Assignment configuration
 */
export interface AssignmentConfigV2 {
  /** Assignment mode */
  mode: AssignmentModeV2;
  /** Selected user IDs for round-robin */
  selectedUserIds: string[];
  /** Column name for by_column mode */
  assignmentColumn?: string;
}

/**
 * Sales user for assignment
 */
export interface SalesUserV2 {
  id: string;
  displayName: string;
  avatar?: string | null;
  role: 'admin' | 'sales';
}

// =============================================================================
// DUPLICATE TYPES
// =============================================================================

import type { DuplicateStrategyV2, DuplicateCheckField, UnifiedRowAction } from '../config/constants';

/**
 * Duplicate handling configuration
 */
export interface DuplicateConfigV2 {
  /** Default strategy for handling duplicates */
  strategy: DuplicateStrategyV2;
  /** Fields to check for duplicates */
  checkFields: DuplicateCheckField[];
  /** Whether to check against database */
  checkDatabase: boolean;
  /** Whether to check within file */
  checkWithinFile: boolean;
}

/**
 * Per-row duplicate action override
 * Uses UnifiedRowAction from UI ('skip' | 'import' | 'update')
 * Maps to worker internally: 'import' -> 'create'
 */
export type RowDuplicateAction = UnifiedRowAction;

// =============================================================================
// IMPORT OPTIONS (Combined config for commit)
// =============================================================================

/**
 * Complete import options
 */
export interface ImportOptionsV2 {
  /** Assignment configuration */
  assignment: AssignmentConfigV2;
  /** Duplicate handling */
  duplicates: DuplicateConfigV2;
  /** Default status for new leads */
  defaultStatus: string;
  /** Default source for imported leads */
  defaultSource: string;
}

// =============================================================================
// IMPORT RESULT TYPES
// =============================================================================

import type { RowResultStatus } from '../config/constants';

/**
 * Result for a single imported row
 */
export interface ImportRowResultV2 {
  /** Row number from file */
  rowNumber: number;
  /** What happened to this row */
  status: RowResultStatus;
  /** Lead ID if created/updated */
  leadId?: string;
  /** Reason for skip/error (French) */
  reason?: string;
  /** Key data for display */
  displayData: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    company?: string | null;
  };
  /** For updates: what fields changed */
  changedFields?: LeadFieldKey[];
  /** Duplicate match info (for skipped duplicates) */
  duplicateInfo?: {
    matchedField: DuplicateCheckField;
    matchedValue: string;
    existingLeadId: string;
  };
}

/**
 * Complete import results summary
 */
export interface ImportResultsSummaryV2 {
  /** Total rows processed */
  totalRows: number;
  /** Successfully imported (new leads) */
  importedCount: number;
  /** Updated existing leads */
  updatedCount: number;
  /** Skipped (duplicates, by user choice) */
  skippedCount: number;
  /** Failed (errors) */
  errorCount: number;
  /** Duration in milliseconds */
  durationMs: number;
  /** Detailed results by category */
  importedRows: ImportRowResultV2[];
  updatedRows: ImportRowResultV2[];
  skippedRows: ImportRowResultV2[];
  errorRows: ImportRowResultV2[];
}

// =============================================================================
// PROGRESS TYPES
// =============================================================================

import type { ProgressPhase, ImportJobStatusV2 } from '../config/constants';

/**
 * Real-time progress data
 */
export interface ImportProgressV2 {
  /** Current job status */
  status: ImportJobStatusV2;
  /** Current phase within importing */
  phase: ProgressPhase;
  /** Total rows to process */
  totalRows: number;
  /** Rows processed so far */
  processedRows: number;
  /** Current batch number */
  currentBatch: number;
  /** Total batches */
  totalBatches: number;
  /** Live counters */
  counters: {
    imported: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  /** Error message if failed */
  errorMessage?: string;
  /** Estimated time remaining (seconds) */
  estimatedTimeRemaining?: number;
}
