/**
 * Import V2 Module
 *
 * New import system with enhanced duplicate handling,
 * per-row actions, and full transparency.
 */

// =============================================================================
// CONFIG & CONSTANTS
// =============================================================================

export * from './config/constants';

// =============================================================================
// TYPES
// =============================================================================

export * from './types';

// =============================================================================
// RE-EXPORTS FROM V1 (shared utilities)
// =============================================================================

// Column aliases and auto-mapping (reuse from v1)
export {
  COLUMN_ALIASES,
  REQUIRED_CONTACT_FIELDS,
  normalizeHeader,
  calculateSimilarity,
  findBestMatch,
} from '../import/config/column-aliases';

// =============================================================================
// PARSERS
// =============================================================================

export {
  parseFile,
  parseCSV,
  parseXLSX,
  getXLSXSheetNames,
  validateFile,
  detectFileType,
  detectDelimiter,
  createParsedRow,
  type ParseOptions,
  type ParseResult,
  type ParseProgressCallback,
} from './lib/parsers';

// =============================================================================
// VALIDATORS
// =============================================================================

export {
  validateRow,
  validateRows,
  applyMapping,
  normalizeRowData,
  normalizePhone,
  normalizeEmail,
  normalizeText,
  normalizePostalCode,
  capitalizeWords,
  tryFixEmailDomain,
  getFieldLabel,
  formatValidationError,
  emailSchema,
  phoneSchema,
  importRowSchema,
} from './lib/validators/row-validator';

// =============================================================================
// HOOKS
// =============================================================================

export {
  useClientParser,
  getMappingStats,
  hasRequiredContactField,
  getMappedFields,
  type ParsingProgress,
  type ClientParseResult,
  type UseClientParserReturn,
  type ClientParseOptions,
} from './hooks';

// =============================================================================
// PROCESSORS (Duplicate Detection)
// =============================================================================

export {
  // File duplicates
  detectFileDuplicates,
  getFirstOccurrence,
  getDuplicateRows,
  getDuplicateGroupSummary,
  getUniqueRows,
  hasCheckableFields,
  type FileDuplicateResult,
  type RowWithFileDuplicateInfo,
  // DB duplicates
  detectDbDuplicates,
  getNonDuplicateRows,
  getChangedFieldsSummary,
  buildDbDuplicatePreview,
  fetchExistingLead,
  type DbDuplicateResult,
  type RowWithDbDuplicateInfo,
} from './lib/processors';

// =============================================================================
// COMPONENTS
// =============================================================================

export {
  // Preview components
  PreviewSummaryCards,
  PreviewSummaryCardsSkeleton,
  PreviewIssueTable,
  PreviewIssueTableSkeleton,
  PreviewStep,
  PreviewStepSkeleton,
  UnifiedRowActions,
  UnifiedRowActionsCompact,
  UnifiedRowModal,
  type IssueRow,
  // Upload step
  UploadStep,
  UploadStepSkeleton,
  // Import step (progress & results)
  ImportStep,
  ImportStepSkeleton,
  // Main wizard
  ImportWizardV2,
  ImportWizardV2Skeleton,
} from './components';

// =============================================================================
// CONTEXT
// =============================================================================

export { ImportWizardProvider, useImportWizard } from './context';

// =============================================================================
// WORKERS
// =============================================================================

export {
  handleCommitV2,
  type CommitOptionsV2,
  type CommitProgress,
} from './workers';

// =============================================================================
// VIEWS
// =============================================================================

export { ImportV2View } from './views';
