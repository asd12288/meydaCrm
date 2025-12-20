/**
 * Import Processors Module
 *
 * Core processing logic for imports:
 * - Duplicate detection
 * - Assignment handling
 */

export {
  buildDedupeSet,
  checkDuplicate,
  addToFileSet,
  findExistingLeadId,
  findExistingLeadIds,
  type DedupeField,
  type DedupeConfig,
  type DedupeResult,
} from './dedupe';

export {
  buildAssignmentContext,
  getAssignment,
  validateAssignmentConfig,
  createAssignmentStats,
  recordAssignment,
  type AssignmentMode,
  type AssignmentConfig,
  type AssignmentContext,
  type AssignmentStats,
} from './assignment';
