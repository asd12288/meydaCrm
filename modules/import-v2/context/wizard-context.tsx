/**
 * Import V2 Wizard Context
 *
 * React Context + useReducer for managing the 3-step import wizard state
 */

'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  type ImportWizardStateV2,
  type ImportWizardAction,
  type ImportWizardContextValue,
  initialWizardState,
} from '../types/wizard';
import type { WizardStepV2 } from '../config/constants';

// =============================================================================
// REDUCER
// =============================================================================

function wizardReducer(
  state: ImportWizardStateV2,
  action: ImportWizardAction
): ImportWizardStateV2 {
  switch (action.type) {
    // -------------------------------------------------------------------------
    // Navigation
    // -------------------------------------------------------------------------
    case 'GO_TO_STEP':
      return { ...state, currentStep: action.payload };

    case 'NEXT_STEP': {
      const steps: WizardStepV2[] = ['upload', 'preview', 'import'];
      const currentIndex = steps.indexOf(state.currentStep);
      if (currentIndex < steps.length - 1) {
        return { ...state, currentStep: steps[currentIndex + 1] };
      }
      return state;
    }

    case 'PREV_STEP': {
      const steps: WizardStepV2[] = ['upload', 'preview', 'import'];
      const currentIndex = steps.indexOf(state.currentStep);
      if (currentIndex > 0) {
        return { ...state, currentStep: steps[currentIndex - 1] };
      }
      return state;
    }

    // -------------------------------------------------------------------------
    // Step 1: File & Mapping
    // -------------------------------------------------------------------------
    case 'SET_ORIGINAL_FILE':
      return { ...state, originalFile: action.payload };

    case 'SET_PARSED_FILE':
      return { ...state, parsedFile: action.payload };

    case 'SET_MAPPING':
      return { ...state, mapping: action.payload };

    case 'UPDATE_MAPPING': {
      if (!state.mapping) return state;
      const { sourceIndex, targetField } = action.payload;
      const updatedMappings = state.mapping.mappings.map((m) =>
        m.sourceIndex === sourceIndex
          ? { ...m, targetField, isManual: true, confidence: 1 }
          : m
      );
      return {
        ...state,
        mapping: { ...state.mapping, mappings: updatedMappings },
      };
    }

    case 'SET_IMPORT_JOB_ID':
      return { ...state, importJobId: action.payload };

    case 'CLEAR_FILE':
      return {
        ...state,
        originalFile: null,
        parsedFile: null,
        mapping: null,
        importJobId: null,
        preview: null,
        rowDecisions: new Map(),
        editedRows: new Map(),
        progress: null,
        results: null,
        error: null,
      };

    // -------------------------------------------------------------------------
    // Step 2: Preview & Config
    // -------------------------------------------------------------------------
    case 'SET_PREVIEW':
      return { ...state, preview: action.payload };

    case 'SET_ASSIGNMENT':
      return { ...state, assignment: { ...state.assignment, ...action.payload } };

    case 'SET_DUPLICATES':
      return { ...state, duplicates: { ...state.duplicates, ...action.payload } };

    // Unified row decisions (replaces separate row/error actions)
    case 'SET_ROW_DECISION': {
      const { rowNumber, action: rowAction } = action.payload;
      const newRowDecisions = new Map(state.rowDecisions);
      newRowDecisions.set(rowNumber, rowAction);
      return { ...state, rowDecisions: newRowDecisions };
    }

    case 'SET_ALL_ROW_DECISIONS': {
      if (!state.preview) return state;
      const { issueType, action: rowAction } = action.payload;
      const newRowDecisions = new Map(state.rowDecisions);

      // Apply action to all rows of the specified issue type
      if (issueType === 'invalid') {
        for (const row of state.preview.invalidRows) {
          newRowDecisions.set(row.rowNumber, rowAction);
        }
      } else if (issueType === 'file_duplicate') {
        for (const row of state.preview.fileDuplicateRows) {
          newRowDecisions.set(row.rowNumber, rowAction);
        }
      } else if (issueType === 'db_duplicate') {
        for (const row of state.preview.dbDuplicateRows) {
          newRowDecisions.set(row.rowNumber, rowAction);
        }
      }

      return { ...state, rowDecisions: newRowDecisions };
    }

    case 'CLEAR_ROW_DECISIONS':
      return { ...state, rowDecisions: new Map() };

    // Edited row data (for inline editing)
    case 'SET_EDITED_ROW_FIELD': {
      const { rowNumber, field, value } = action.payload;
      const newEditedRows = new Map(state.editedRows);
      const rowEdits = newEditedRows.get(rowNumber) || {};
      newEditedRows.set(rowNumber, { ...rowEdits, [field]: value });
      return { ...state, editedRows: newEditedRows };
    }

    case 'CLEAR_ROW_EDITS': {
      const newEditedRows = new Map(state.editedRows);
      newEditedRows.delete(action.payload);
      return { ...state, editedRows: newEditedRows };
    }

    case 'SET_DEFAULT_STATUS':
      return { ...state, defaultStatus: action.payload };

    case 'SET_DEFAULT_SOURCE':
      return { ...state, defaultSource: action.payload };

    // -------------------------------------------------------------------------
    // Step 3: Progress & Results
    // -------------------------------------------------------------------------
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };

    case 'SET_RESULTS':
      return { ...state, results: action.payload };

    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };

    // -------------------------------------------------------------------------
    // UI State
    // -------------------------------------------------------------------------
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };

    case 'SET_PARSING':
      return { ...state, isParsing: action.payload };

    case 'SET_CHECKING_DUPLICATES':
      return { ...state, isCheckingDuplicates: action.payload };

    case 'SET_IMPORTING':
      return { ...state, isImporting: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    // -------------------------------------------------------------------------
    // Reset
    // -------------------------------------------------------------------------
    case 'RESET':
      return { ...initialWizardState, rowDecisions: new Map(), editedRows: new Map() };

    case 'RESET_FOR_NEW_IMPORT':
      return {
        ...initialWizardState,
        rowDecisions: new Map(),
        editedRows: new Map(),
        // Keep assignment preferences
        assignment: state.assignment,
        duplicates: state.duplicates,
        defaultStatus: state.defaultStatus,
      };

    default:
      return state;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

const ImportWizardContext = createContext<ImportWizardContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface ImportWizardProviderProps {
  children: ReactNode;
}

export function ImportWizardProvider({ children }: ImportWizardProviderProps) {
  const [state, dispatch] = useReducer(wizardReducer, {
    ...initialWizardState,
    rowDecisions: new Map(),
    editedRows: new Map(),
  });

  // Convenience methods
  const goToStep = useCallback((step: WizardStepV2) => {
    dispatch({ type: 'GO_TO_STEP', payload: step });
  }, []);

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  const prevStep = useCallback(() => {
    dispatch({ type: 'PREV_STEP' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const resetForNewImport = useCallback(() => {
    dispatch({ type: 'RESET_FOR_NEW_IMPORT' });
  }, []);

  // Computed values
  const canProceedToPreview = useMemo(() => {
    // Need parsed file and valid mapping
    if (!state.parsedFile || !state.mapping) return false;

    // Need at least one mapped field
    const hasMappedField = state.mapping.mappings.some((m) => m.targetField !== null);
    if (!hasMappedField) return false;

    // Need at least one contact field (email, phone, or external_id)
    const contactFields = ['email', 'phone', 'external_id'];
    const hasContactField = state.mapping.mappings.some(
      (m) => m.targetField && contactFields.includes(m.targetField)
    );

    return hasContactField;
  }, [state.parsedFile, state.mapping]);

  const canProceedToImport = useMemo(() => {
    // Need preview data
    if (!state.preview) return false;

    // Need at least one valid row OR one row with action
    const hasValidRows = state.preview.summary.valid > 0;
    const hasActionableRows = state.rowDecisions.size > 0;

    return hasValidRows || hasActionableRows;
  }, [state.preview, state.rowDecisions]);

  const isTerminalState = useMemo(() => {
    // Import is complete (success or failure)
    return state.results !== null || state.error !== null;
  }, [state.results, state.error]);

  const value: ImportWizardContextValue = {
    state,
    dispatch,
    goToStep,
    nextStep,
    prevStep,
    reset,
    resetForNewImport,
    canProceedToPreview,
    canProceedToImport,
    isTerminalState,
  };

  return (
    <ImportWizardContext.Provider value={value}>
      {children}
    </ImportWizardContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useImportWizard(): ImportWizardContextValue {
  const context = useContext(ImportWizardContext);
  if (!context) {
    throw new Error('useImportWizard must be used within ImportWizardProvider');
  }
  return context;
}
