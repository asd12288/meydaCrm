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
  getRecentImportJobs,
  updateImportJobMapping,
  updateImportJobOptions,
  startImportParsing,
  startImportCommit,
  cancelImportJob,
  getImportRows,
  deleteImportJob,
} from './lib/actions';

// Hooks
export { useImportWizard, type UseImportWizardReturn } from './hooks/use-import-wizard';
export { useImportSSE, useImportProgress } from './hooks/use-import-sse';

// Views
export { ImportWizardView } from './views/import-wizard-view';
export { ImportHistoryView } from './views/import-history-view';
export { ImportDashboardView } from './views/import-dashboard-view';

// Components (6-step wizard V2)
export { ImportWizardV2 } from './components/import-wizard-v2';
export { UploadStep } from './components/upload-step';
export { MappingStep } from './components/mapping-step';
export { OptionsStep } from './components/options-step';
export { PreviewStep } from './components/preview-step';
export { ProgressStep } from './components/progress-step';
export { ResultsStep } from './components/results-step';
export { WizardStepper } from './components/wizard-stepper';
export { RecentHistoryCard } from './components/recent-history-card';
export { ImportWizardCard } from './components/import-wizard-card';

// UI
export { FileDropzone } from './ui/file-dropzone';
export { ImportProgressBar, WizardSteps } from './ui/import-progress';
