// =============================================================================
// IMPORT MODULE - BARREL EXPORTS
// =============================================================================

// Types
export * from './types';

// Config
export {
  // File limits
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  ALLOWED_FILE_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  // Chunk processing
  PARSE_CHUNK_SIZE,
  COMMIT_BATCH_SIZE,
  PREVIEW_ROW_LIMIT,
  ERROR_PREVIEW_LIMIT,
  MAX_IMPORT_ROWS,
  AUTO_MAP_CONFIDENCE_THRESHOLD,
  // Status labels
  IMPORT_STATUS_LABELS,
  IMPORT_STATUS_COLORS,
  IMPORT_ROW_STATUS_LABELS,
  IMPORT_ROW_STATUS_COLORS,
  // Wizard steps
  IMPORT_WIZARD_STEPS,
  // Options
  DUPLICATE_STRATEGIES,
  ASSIGNMENT_MODES,
  type ImportWizardStep,
  type DuplicateStrategy,
  type AssignmentMode,
} from './config/constants';

export {
  // Column aliases
  COLUMN_ALIASES,
  REQUIRED_CONTACT_FIELDS,
  // Helper functions
  normalizeHeader,
  calculateSimilarity,
  findBestMatch,
} from './config/column-aliases';

// Re-export from centralized constants
export { LEAD_FIELD_LABELS } from '@/lib/constants';

// Library functions
export {
  // Validators
  validateRow,
  validateRows,
  findDuplicatesInFile,
  // Normalizers
  normalizePhone,
  normalizeEmail,
  normalizeText,
  normalizePostalCode,
  normalizeRowData,
  getFieldLabel,
} from './lib/validators';

export {
  // Auto-mapper
  autoMapColumn,
  autoMapColumns,
  getAvailableTargetFields,
  checkRequiredMappings,
  getMappingSummary,
  type AutoMapResult,
} from './lib/auto-mapper';

export {
  // Parsers
  detectDelimiter,
  parseCSVLine,
  parseCSVContent,
  applyColumnMapping,
  readFileAsText,
  getFileExtension,
  validateFileType,
  validateFileSize,
  generateFilePreview,
  processRowsInChunks,
} from './lib/parsers';

// Server Actions
export {
  uploadImportFile,
  getImportJob,
  getImportJobs,
  updateImportJobMapping,
  startImportParsing,
  startImportCommit,
  getImportRows,
  deleteImportJob,
} from './lib/actions';

// Hooks
export { useImportWizard, type UseImportWizardReturn } from './hooks/use-import-wizard';

// Views
export { ImportWizardView } from './views/import-wizard-view';

// Components (3-step simplified flow)
export { ImportWizard } from './components/import-wizard';
export { UploadStep } from './components/upload-step';
export { ReviewStep } from './components/review-step';

// UI
export { FileDropzone } from './ui/file-dropzone';
export { ImportProgressBar, WizardSteps } from './ui/import-progress';
