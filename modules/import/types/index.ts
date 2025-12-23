import { z } from 'zod';
import type { ImportStatus, ImportRowStatus } from '@/db/types';

// Re-export mapping types
export * from './mapping';
export type { LeadFieldKey } from './mapping';

// =============================================================================
// ZOD SCHEMAS FOR IMPORT VALIDATION
// =============================================================================

/**
 * Email validation (optional but must be valid if present)
 */
export const emailSchema = z
  .string()
  .email('Format email invalide')
  .max(255, 'Email trop long (max 255 caracteres)')
  .optional()
  .nullable()
  .or(z.literal(''));

/**
 * Phone validation with French number normalization
 */
export const phoneSchema = z
  .string()
  .max(50, 'Numero trop long (max 50 caracteres)')
  .optional()
  .nullable()
  .transform((val) => {
    if (!val) return val;
    // Remove spaces, dots, dashes
    let normalized = val.replace(/[\s.\-()]/g, '');
    // Convert French local format to international
    if (normalized.startsWith('0') && normalized.length === 10) {
      normalized = '+33' + normalized.slice(1);
    }
    return normalized;
  });

/**
 * Postal code validation (French format)
 */
export const postalCodeSchema = z
  .string()
  .max(20, 'Code postal trop long')
  .optional()
  .nullable()
  .refine(
    (val) => {
      if (!val) return true;
      // French postal code: 5 digits
      return /^\d{5}$/.test(val) || /^\d{4,10}$/.test(val);
    },
    { message: 'Format de code postal invalide' }
  );

/**
 * Schema for a single row of import data
 */
export const importRowDataSchema = z.object({
  external_id: z.string().max(100).optional().nullable(),
  first_name: z.string().max(100).optional().nullable(),
  last_name: z.string().max(100).optional().nullable(),
  email: emailSchema,
  phone: phoneSchema,
  company: z.string().max(200).optional().nullable(),
  job_title: z.string().max(100).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  postal_code: postalCodeSchema,
  country: z.string().max(100).optional().nullable(),
  status: z.string().max(50).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  assigned_to: z.string().optional().nullable(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
});

export type ImportRowData = z.infer<typeof importRowDataSchema>;

/**
 * Schema for validating that at least one contact field is present
 */
export const hasContactInfoSchema = importRowDataSchema.refine(
  (data) => {
    return !!(data.email || data.phone || data.external_id);
  },
  {
    message: 'Au moins un champ de contact requis (email, telephone ou ID externe)',
  }
);

// =============================================================================
// FILE UPLOAD SCHEMAS
// =============================================================================

export const fileUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ['csv', 'xlsx', 'xls'].includes(ext || '');
    },
    { message: 'Format de fichier non supporte. Utilisez CSV ou Excel.' }
  ).refine(
    (file) => file.size <= 50 * 1024 * 1024,
    { message: 'Fichier trop volumineux (max 50 MB)' }
  ),
});

// =============================================================================
// COLUMN MAPPING SCHEMAS
// =============================================================================

export const columnMappingSchema = z.object({
  sourceColumn: z.string(),
  sourceIndex: z.number().int().min(0),
  targetField: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  isManual: z.boolean(),
  sampleValues: z.array(z.string()),
});

export const columnMappingConfigSchema = z.object({
  mappings: z.array(columnMappingSchema),
  hasHeaderRow: z.boolean(),
  headerRowIndex: z.number().int().min(0),
  encoding: z.string(),
  delimiter: z.string(),
  sheetName: z.string().optional(),
});

// =============================================================================
// ASSIGNMENT SCHEMAS
// =============================================================================

export const assignmentConfigSchema = z.object({
  mode: z.enum(['none', 'round_robin', 'by_column']),
  roundRobinUserIds: z.array(z.string().uuid()).optional(),
  assignmentColumn: z.string().optional(),
}).refine(
  (data) => {
    if (data.mode === 'round_robin' && (!data.roundRobinUserIds || data.roundRobinUserIds.length === 0)) return false;
    if (data.mode === 'by_column' && !data.assignmentColumn) return false;
    return true;
  },
  { message: 'Configuration d\'attribution incomplete' }
);

export const duplicateConfigSchema = z.object({
  strategy: z.enum(['skip', 'update', 'create']),
  checkFields: z.array(z.enum(['external_id', 'email', 'phone'])),
  checkDatabase: z.boolean(),
  checkWithinFile: z.boolean(),
});

// =============================================================================
// IMPORT JOB SCHEMAS
// =============================================================================

export const createImportJobSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.enum(['csv', 'xlsx', 'xls']),
  storagePath: z.string().min(1),
  columnMapping: columnMappingConfigSchema.optional(),
});

export const startImportSchema = z.object({
  importJobId: z.string().uuid(),
  columnMapping: columnMappingConfigSchema,
  assignment: assignmentConfigSchema,
  duplicates: duplicateConfigSchema,
  defaultStatus: z.string().default('new'),
  defaultSource: z.string().optional(),
});

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Import job with row counts
 */
export interface ImportJobWithStats {
  id: string;
  created_by: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  status: ImportStatus;
  total_rows: number | null;
  valid_rows: number | null;
  invalid_rows: number | null;
  imported_rows: number | null;
  skipped_rows: number | null;
  processed_rows: number | null;
  current_chunk: number | null;
  total_chunks: number | null;
  column_mapping: Record<string, unknown> | null;
  error_message: string | null;
  error_details: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    display_name: string | null;
  };
}

/**
 * Import row with validation details
 */
export interface ImportRowWithDetails {
  id: string;
  import_job_id: string;
  row_number: number;
  chunk_number: number;
  status: ImportRowStatus;
  raw_data: Record<string, unknown>;
  normalized_data: Record<string, unknown> | null;
  validation_errors: Record<string, string> | null;
  lead_id: string | null;
  error_message: string | null;
  created_at: string;
}

/**
 * Paginated import rows response
 */
export interface PaginatedImportRows {
  rows: ImportRowWithDetails[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =============================================================================
// VALIDATION RESULT TYPES
// =============================================================================

export interface FieldValidationError {
  field: string;
  message: string;
  value?: string;
}

export interface RowValidationResult {
  rowNumber: number;
  isValid: boolean;
  errors: FieldValidationError[];
  warnings: FieldValidationError[];
  normalizedData: ImportRowData;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  errors: {
    field: string;
    count: number;
    message: string;
  }[];
  warnings: {
    field: string;
    count: number;
    message: string;
  }[];
}

// =============================================================================
// ACTION RESPONSE TYPES
// =============================================================================

export interface ImportActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, unknown>;
}

export interface ParseFileResult {
  headers: string[];
  rowCount: number;
  sampleRows: string[][];
  encoding: string;
  delimiter: string;
  sheets?: string[];
}

export interface ValidateRowsResult {
  validationSummary: ValidationSummary;
  previewRows: RowValidationResult[];
}

export interface CommitImportResult {
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  importJobId: string;
}

// =============================================================================
// SSE REAL-TIME PROGRESS TYPES
// =============================================================================

/**
 * Import job progress data from database (sent via SSE)
 * Note: This is different from ImportProgress in mapping.ts which is for wizard UI state
 */
export interface ImportJobProgress {
  id: string;
  status: ImportStatus;
  totalRows: number | null;
  processedRows: number | null;
  validRows: number | null;
  invalidRows: number | null;
  importedRows: number | null;
  skippedRows: number | null;
  currentChunk: number | null;
  totalChunks: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
}

/**
 * SSE event types
 */
export type SSEEventType = 'progress' | 'complete' | 'error' | 'heartbeat';

/**
 * SSE message structure
 */
export interface SSEMessage {
  type: SSEEventType;
  data: ImportJobProgress | null;
  timestamp: string;
}

// =============================================================================
// UI STATE TYPES (Leave-and-Return)
// =============================================================================

/**
 * Wizard step identifiers
 */
export type WizardStep = 'upload' | 'mapping' | 'options' | 'preview' | 'progress' | 'results';

/**
 * Wizard step configuration
 */
export interface WizardStepConfig {
  id: WizardStep;
  number: number;
  label: string;
  description: string;
  canSkipTo: boolean;
}

/**
 * Complete wizard state for persistence
 */
export interface WizardState {
  currentStep: WizardStep;
  importJobId: string | null;
  uploadComplete: boolean;
  mappingComplete: boolean;
  optionsComplete: boolean;
  previewComplete: boolean;
  isProcessing: boolean;
}
