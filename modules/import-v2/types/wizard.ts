/**
 * Import V2 Wizard State Types
 *
 * Types for managing the 3-step wizard state
 */

import type { WizardStepV2 } from '../config/constants';
import type {
  ParsedFileV2,
  ColumnMappingConfigV2,
  AssignmentConfigV2,
  DuplicateConfigV2,
  ImportProgressV2,
  ImportResultsSummaryV2,
  RowDuplicateAction,
} from './index';
import type { DetailedPreviewDataV2 } from './preview';
import type { LeadFieldKey } from '../../import/types/mapping';

// =============================================================================
// WIZARD STATE
// =============================================================================

/**
 * Complete wizard state for the 3-step import flow
 */
export interface ImportWizardStateV2 {
  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  /** Current wizard step */
  currentStep: WizardStepV2;

  // -------------------------------------------------------------------------
  // Step 1: Upload & Mapping
  // -------------------------------------------------------------------------

  /** Original file object (for re-parsing if needed) */
  originalFile: File | null;

  /** Parsed file data */
  parsedFile: ParsedFileV2 | null;

  /** Column mapping configuration */
  mapping: ColumnMappingConfigV2 | null;

  /** Import job ID (created after upload) */
  importJobId: string | null;

  // -------------------------------------------------------------------------
  // Step 2: Preview & Configuration
  // -------------------------------------------------------------------------

  /** Detailed preview data with validation and duplicates */
  preview: DetailedPreviewDataV2 | null;

  /** Assignment configuration */
  assignment: AssignmentConfigV2;

  /** Duplicate handling configuration */
  duplicates: DuplicateConfigV2;

  /** Per-row duplicate action overrides */
  rowActions: Map<number, RowDuplicateAction>;

  /** Default status for new leads */
  defaultStatus: string;

  /** Default source for imported leads */
  defaultSource: string;

  // -------------------------------------------------------------------------
  // Step 3: Import Progress & Results
  // -------------------------------------------------------------------------

  /** Real-time progress data */
  progress: ImportProgressV2 | null;

  /** Final import results */
  results: ImportResultsSummaryV2 | null;

  // -------------------------------------------------------------------------
  // UI State
  // -------------------------------------------------------------------------

  /** Is currently processing (parsing, uploading, etc.) */
  isProcessing: boolean;

  /** Is currently parsing file */
  isParsing: boolean;

  /** Is checking duplicates against database */
  isCheckingDuplicates: boolean;

  /** Is import in progress */
  isImporting: boolean;

  /** Global error message */
  error: string | null;

  /** SSE/Polling connection status */
  isConnected: boolean;
}

// =============================================================================
// WIZARD ACTIONS (for reducer)
// =============================================================================

export type ImportWizardAction =
  // Navigation
  | { type: 'GO_TO_STEP'; payload: WizardStepV2 }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }

  // Step 1: File & Mapping
  | { type: 'SET_ORIGINAL_FILE'; payload: File }
  | { type: 'SET_PARSED_FILE'; payload: ParsedFileV2 }
  | { type: 'SET_MAPPING'; payload: ColumnMappingConfigV2 }
  | { type: 'UPDATE_MAPPING'; payload: { sourceIndex: number; targetField: LeadFieldKey | null } }
  | { type: 'SET_IMPORT_JOB_ID'; payload: string }
  | { type: 'CLEAR_FILE' }

  // Step 2: Preview & Config
  | { type: 'SET_PREVIEW'; payload: DetailedPreviewDataV2 }
  | { type: 'SET_ASSIGNMENT'; payload: Partial<AssignmentConfigV2> }
  | { type: 'SET_DUPLICATES'; payload: Partial<DuplicateConfigV2> }
  | { type: 'SET_ROW_ACTION'; payload: { rowNumber: number; action: RowDuplicateAction } }
  | { type: 'SET_ALL_ROW_ACTIONS'; payload: RowDuplicateAction }
  | { type: 'CLEAR_ROW_ACTIONS' }
  | { type: 'SET_DEFAULT_STATUS'; payload: string }
  | { type: 'SET_DEFAULT_SOURCE'; payload: string }

  // Step 3: Progress & Results
  | { type: 'SET_PROGRESS'; payload: ImportProgressV2 }
  | { type: 'SET_RESULTS'; payload: ImportResultsSummaryV2 }
  | { type: 'SET_CONNECTED'; payload: boolean }

  // UI State
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_PARSING'; payload: boolean }
  | { type: 'SET_CHECKING_DUPLICATES'; payload: boolean }
  | { type: 'SET_IMPORTING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }

  // Reset
  | { type: 'RESET' }
  | { type: 'RESET_FOR_NEW_IMPORT' };

// =============================================================================
// INITIAL STATE
// =============================================================================

/**
 * Default initial state for the wizard
 */
export const initialWizardState: ImportWizardStateV2 = {
  // Navigation
  currentStep: 'upload',

  // Step 1
  originalFile: null,
  parsedFile: null,
  mapping: null,
  importJobId: null,

  // Step 2
  preview: null,
  assignment: {
    mode: 'none',
    selectedUserIds: [],
  },
  duplicates: {
    strategy: 'skip',
    checkFields: ['email', 'phone', 'external_id'],
    checkDatabase: true,
    checkWithinFile: true,
  },
  rowActions: new Map(),
  defaultStatus: 'new',
  defaultSource: '',

  // Step 3
  progress: null,
  results: null,

  // UI State
  isProcessing: false,
  isParsing: false,
  isCheckingDuplicates: false,
  isImporting: false,
  error: null,
  isConnected: false,
};

// =============================================================================
// CONTEXT TYPE
// =============================================================================

/**
 * Wizard context value type
 */
export interface ImportWizardContextValue {
  state: ImportWizardStateV2;
  dispatch: React.Dispatch<ImportWizardAction>;

  // Convenience methods
  goToStep: (step: WizardStepV2) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  resetForNewImport: () => void;

  // Computed values
  canProceedToPreview: boolean;
  canProceedToImport: boolean;
  isTerminalState: boolean;
}
