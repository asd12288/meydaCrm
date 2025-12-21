import type { DuplicateStrategy, AssignmentMode } from '../config/constants';

// =============================================================================
// COLUMN MAPPING TYPES
// =============================================================================

/**
 * Mapping of a single file column to a lead field
 */
export interface ColumnMapping {
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
 * Complete column mapping configuration for an import
 */
export interface ColumnMappingConfig {
  /** All column mappings */
  mappings: ColumnMapping[];
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
// LEAD FIELD KEYS
// =============================================================================

/**
 * All possible lead fields that can be mapped
 */
export type LeadFieldKey =
  | 'external_id'
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'phone'
  | 'company'
  | 'job_title'
  | 'address'
  | 'city'
  | 'postal_code'
  | 'country'
  | 'status'
  | 'source'
  | 'notes'
  | 'assigned_to'
  | 'created_at'
  | 'updated_at';

/**
 * Fields that are required for a valid lead (at least one must be present)
 */
export const REQUIRED_FIELDS: LeadFieldKey[] = ['email', 'phone', 'external_id'];

/**
 * Fields that can be used for duplicate detection
 */
export const DUPLICATE_CHECK_FIELDS: LeadFieldKey[] = ['external_id', 'email', 'phone'];

// =============================================================================
// PARSED ROW TYPES
// =============================================================================

/**
 * A single row of raw data from the file
 */
export interface RawRow {
  /** Row number in the file (1-based for display) */
  rowNumber: number;
  /** Raw values by column index */
  values: string[];
  /** Original line content (for error reporting) */
  rawLine?: string;
}

/**
 * A row after applying column mapping
 */
export interface MappedRow {
  /** Row number in the file (1-based) */
  rowNumber: number;
  /** Mapped data by field key (can include null from normalization) */
  data: Partial<Record<LeadFieldKey, string | null>>;
  /** Unmapped columns (for reference) */
  unmapped: Record<string, string>;
}

/**
 * A row after validation
 */
export interface ValidatedRow extends MappedRow {
  /** Whether the row is valid */
  isValid: boolean;
  /** Validation errors by field */
  errors: Partial<Record<LeadFieldKey, string>>;
  /** Validation warnings by field */
  warnings: Partial<Record<LeadFieldKey, string>>;
  /** Duplicate detection result */
  duplicateOf?: {
    type: 'file' | 'database';
    matchedValue: string;
    matchedField: LeadFieldKey;
    existingLeadId?: string;
  };
}

// =============================================================================
// IMPORT CONFIGURATION TYPES
// =============================================================================

/**
 * Assignment configuration for the import
 */
export interface AssignmentConfig {
  /** Assignment mode */
  mode: AssignmentMode;
  /** Selected user ID (for 'single' mode) */
  singleUserId?: string;
  /** Selected user IDs (for 'round_robin' mode) */
  roundRobinUserIds?: string[];
  /** Column to use for assignment (for 'by_column' mode) */
  assignmentColumn?: string;
}

/**
 * Duplicate handling configuration
 */
export interface DuplicateConfig {
  /** How to handle duplicates */
  strategy: DuplicateStrategy;
  /** Fields to check for duplicates */
  checkFields: LeadFieldKey[];
  /** Whether to check against existing database leads */
  checkDatabase: boolean;
  /** Whether to check for duplicates within the file */
  checkWithinFile: boolean;
}

/**
 * Complete import configuration
 */
export interface ImportConfig {
  /** Column mapping */
  mapping: ColumnMappingConfig;
  /** Assignment settings */
  assignment: AssignmentConfig;
  /** Duplicate handling */
  duplicates: DuplicateConfig;
  /** Default status for new leads */
  defaultStatus: string;
  /** Default source for imported leads */
  defaultSource: string;
}

// =============================================================================
// IMPORT PROGRESS TYPES
// =============================================================================

/**
 * Progress information during import
 */
export interface ImportProgress {
  /** Current phase */
  phase: 'uploading' | 'parsing' | 'validating' | 'importing' | 'completed' | 'failed';
  /** Total rows in file */
  totalRows: number;
  /** Rows processed so far */
  processedRows: number;
  /** Valid rows count */
  validRows: number;
  /** Invalid rows count */
  invalidRows: number;
  /** Imported rows count */
  importedRows: number;
  /** Skipped rows count */
  skippedRows: number;
  /** Current chunk being processed */
  currentChunk: number;
  /** Total chunks */
  totalChunks: number;
  /** Error message if failed */
  errorMessage?: string;
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
}

// =============================================================================
// WIZARD STATE TYPES
// =============================================================================

/**
 * File information after upload
 */
export interface UploadedFile {
  /** File name */
  name: string;
  /** File size in bytes */
  size: number;
  /** File type (csv, xlsx, xls) */
  type: 'csv' | 'xlsx' | 'xls';
  /** Storage path in Supabase */
  storagePath: string;
  /** Total row count */
  rowCount: number;
  /** Column headers */
  headers: string[];
  /** Sample data (first N rows) */
  sampleData: RawRow[];
  /** Available sheets (for Excel files) */
  sheets?: string[];
}

/**
 * Import wizard state
 */
export interface ImportWizardState {
  /** Current step */
  currentStep: number;
  /** Uploaded file info */
  file: UploadedFile | null;
  /** Column mapping */
  mapping: ColumnMappingConfig | null;
  /** Validated rows */
  validatedRows: ValidatedRow[];
  /** Validation summary */
  validationSummary: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
  };
  /** Assignment config */
  assignment: AssignmentConfig;
  /** Duplicate config */
  duplicates: DuplicateConfig;
  /** Import job ID (after creation) */
  importJobId: string | null;
  /** Import progress */
  progress: ImportProgress | null;
  /** Error message */
  error: string | null;
}
