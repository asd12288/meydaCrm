/**
 * Import V2 Processors
 *
 * Data processing utilities for duplicate detection and validation
 */

export {
  detectFileDuplicates,
  getFirstOccurrence,
  getDuplicateRows,
  getDuplicateGroupSummary,
  getUniqueRows,
  hasCheckableFields,
  type FileDuplicateResult,
  type RowWithFileDuplicateInfo,
} from './file-dedupe';

// DB duplicate detection
export {
  detectDbDuplicates,
  getNonDuplicateRows,
  getChangedFieldsSummary,
  buildDbDuplicatePreview,
  fetchExistingLead,
  type DbDuplicateResult,
  type RowWithDbDuplicateInfo,
} from './db-dedupe';
