/**
 * Import Wizard V2 - Main Component
 *
 * 3-step import wizard:
 * 1. Upload & Map columns
 * 2. Preview & Configure (duplicates, distribution)
 * 3. Import & Results (progress, final summary)
 */

'use client';

import { useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { IconCheck } from '@tabler/icons-react';

import { WIZARD_STEP_CONFIG, DEFAULT_ACTION_BY_TYPE } from '../config/constants';
import type { WizardStepV2, UnifiedRowAction, PreviewIssueType } from '../config/constants';
import { useImportWizard, ImportWizardProvider } from '../context';
import { useClientParser } from '../hooks';
import { validateRows } from '../lib/validators/row-validator';
import { detectFileDuplicates } from '../lib/processors';
import { startImportV2 } from '../lib/actions';
import { analytics } from '@/lib/analytics';
import type { SalesUser } from '@/modules/leads/types';
import { UploadStep, UploadStepSkeleton } from './upload-step';
import { PreviewStep } from './preview-step';
import { ImportStep } from './import-step';
import { UnifiedRowModal } from './unified-row-modal';
import type { IssueRow } from './preview-issue-table';

import type { LeadFieldKey } from '../../import/types/mapping';
import type {
  DetailedPreviewDataV2,
  InvalidRowV2,
  FileDuplicateRowV2,
  DbDuplicateRowV2,
} from '../types/preview';

// =============================================================================
// STEPPER
// =============================================================================

interface StepperProps {
  currentStep: WizardStepV2;
  completedSteps: WizardStepV2[];
}

function Stepper({ currentStep, completedSteps }: StepperProps) {
  const steps: WizardStepV2[] = ['upload', 'preview', 'import'];

  const getStepStatus = (step: WizardStepV2) => {
    if (completedSteps.includes(step)) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  return (
    <div className="flex items-center justify-center mb-6">
      {steps.map((step, index) => {
        const config = WIZARD_STEP_CONFIG[step];
        const status = getStepStatus(step);

        return (
          <div key={step} className="flex items-center">
            {/* Step circle + label */}
            <div className="flex items-center gap-2">
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium
                  ${status === 'completed' ? 'bg-darklink text-white' : ''}
                  ${status === 'current' ? 'bg-primary text-white' : ''}
                  ${status === 'pending' ? 'bg-lightgray dark:bg-darkgray text-darklink' : ''}
                `}
              >
                {status === 'completed' ? <IconCheck size={14} /> : index + 1}
              </div>
              <span
                className={`text-sm ${
                  status === 'current' ? 'font-medium text-ld' : 'text-darklink'
                }`}
              >
                {config.label}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  w-8 md:w-12 h-px mx-3
                  ${completedSteps.includes(step) ? 'bg-darklink' : 'bg-border dark:bg-darkborder'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// UNIFIED MODAL STATE
// =============================================================================

interface ModalState {
  isOpen: boolean;
  row: IssueRow | null;
  issueType: PreviewIssueType | null;
}

// =============================================================================
// WIZARD CONTENT
// =============================================================================

interface WizardContentProps {
  salesUsers: SalesUser[];
}

function WizardContent({ salesUsers }: WizardContentProps) {
  const router = useRouter();
  const {
    state,
    dispatch,
    nextStep,
    prevStep,
    reset,
    canProceedToPreview,
    canProceedToImport,
  } = useImportWizard();

  // Unified modal state (replaces separate modals)
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    row: null,
    issueType: null,
  });

  // Warning state for DB duplicate check failures
  const [dbCheckWarning, setDbCheckWarning] = useState<string | null>(null);

  // Client-side parser hook
  const { parse, isParsing, error: parseError } = useClientParser();

  // Determine which steps are completed
  const completedSteps: WizardStepV2[] = [];
  if (state.parsedFile && state.mapping) {
    completedSteps.push('upload');
  }
  if (state.preview) {
    completedSteps.push('preview');
  }
  if (state.results) {
    completedSteps.push('import');
  }

  // ==========================================================================
  // STEP 1 HANDLERS
  // ==========================================================================

  const handleFileSelect = useCallback(
    async (file: File) => {
      dispatch({ type: 'SET_ORIGINAL_FILE', payload: file });
      dispatch({ type: 'SET_PARSING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      try {
        const result = await parse(file);
        if (result) {
          dispatch({ type: 'SET_PARSED_FILE', payload: result.file });
          dispatch({ type: 'SET_MAPPING', payload: result.mapping });

          // Track file parsed
          analytics.importV2FileParsed({
            fileType: result.file.type,
            rowCount: result.file.rowCount,
            columnCount: result.file.headers.length,
          });
        }
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Erreur de parsing' });
        analytics.importV2Failed({
          error: err instanceof Error ? err.message : 'Erreur de parsing',
          phase: 'parsing',
        });
      } finally {
        dispatch({ type: 'SET_PARSING', payload: false });
      }
    },
    [dispatch, parse]
  );

  const handleFileClear = useCallback(() => {
    dispatch({ type: 'CLEAR_FILE' });
  }, [dispatch]);

  const handleMappingChange = useCallback(
    (sourceIndex: number, targetField: LeadFieldKey | null) => {
      dispatch({ type: 'UPDATE_MAPPING', payload: { sourceIndex, targetField } });
    },
    [dispatch]
  );

  const handleUploadNext = useCallback(async () => {
    if (!state.parsedFile || !state.mapping) return;

    dispatch({ type: 'SET_CHECKING_DUPLICATES', payload: true });

    try {
      // 1. Validate all rows (applies mapping internally)
      const validationResults = validateRows(state.parsedFile.rows, state.mapping.mappings);

      // 2. Detect file duplicates among valid rows
      const validResults = validationResults.filter((r) => r.isValid);
      const fileDupeResult = detectFileDuplicates(validResults, ['email']);

      // 3. Build preview data - Invalid rows
      const invalidRows: InvalidRowV2[] = validationResults
        .filter((r) => !r.isValid)
        .map((r) => ({
          rowNumber: r.rowNumber,
          issueType: 'invalid' as const,
          validationResult: r, // Include full validation result for editing
          displayData: {
            email: r.normalizedData?.email || null,
            phone: r.normalizedData?.phone || null,
            firstName: r.normalizedData?.first_name || null,
            lastName: r.normalizedData?.last_name || null,
            company: r.normalizedData?.company || null,
          },
          errors: r.errors.map((e) => ({
            field: e.field as LeadFieldKey,
            message: e.message,
          })),
        }));

      // 4. Build file duplicate rows (non-first occurrences) from groups
      const fileDuplicateRows: FileDuplicateRowV2[] = fileDupeResult.duplicateGroups
        .flatMap((group) => group.rows)
        .filter((r) => !r.isFirstOccurrence);

      // 5. Build set of file duplicate row numbers to exclude from DB check
      const fileDuplicateRowNumbers = new Set(
        fileDuplicateRows.map((r) => r.rowNumber)
      );

      // 6. Get rows to check for DB duplicates (valid, non-file-duplicates)
      const rowsForDbCheck = validResults.filter(
        (r) => !fileDuplicateRowNumbers.has(r.rowNumber)
      );

      // 7. Check for DB duplicates via API
      let dbDuplicateRows: DbDuplicateRowV2[] = [];
      if (rowsForDbCheck.length > 0) {
        try {
          const response = await fetch('/api/import-v2/check-duplicates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              validatedRows: rowsForDbCheck,
              checkFields: ['email'], // Only email for duplicate detection
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.duplicateRows) {
              dbDuplicateRows = data.duplicateRows;
            }
            // Clear any previous warning on success
            setDbCheckWarning(null);
          } else {
            const errorText = await response.text();
            console.warn('[ImportWizard] DB duplicate check failed:', errorText);
            setDbCheckWarning('La vérification des doublons en base a échoué. Les doublons existants ne seront pas détectés.');
          }
        } catch (err) {
          console.warn('[ImportWizard] DB duplicate check error:', err);
          setDbCheckWarning('La vérification des doublons en base a échoué. Les doublons existants ne seront pas détectés.');
        }
      }

      // 8. Calculate valid count (excluding file duplicates and DB duplicates)
      const validCount = validResults.length - fileDuplicateRows.length - dbDuplicateRows.length;

      const preview: DetailedPreviewDataV2 = {
        summary: {
          total: state.parsedFile.rowCount,
          valid: validCount,
          invalid: invalidRows.length,
          fileDuplicates: fileDuplicateRows.length,
          dbDuplicates: dbDuplicateRows.length,
        },
        effectiveCounts: {
          willImport: validCount,
          willUpdate: 0, // Will be recalculated based on row decisions
          willSkip: invalidRows.length + fileDuplicateRows.length + dbDuplicateRows.length,
          willError: 0,
        },
        invalidRows,
        fileDuplicateRows,
        dbDuplicateRows,
      };

      // 9. Set default row decisions for all issue rows (default: skip)
      for (const row of invalidRows) {
        dispatch({
          type: 'SET_ROW_DECISION',
          payload: { rowNumber: row.rowNumber, action: DEFAULT_ACTION_BY_TYPE['invalid'] },
        });
      }
      for (const row of fileDuplicateRows) {
        dispatch({
          type: 'SET_ROW_DECISION',
          payload: { rowNumber: row.rowNumber, action: DEFAULT_ACTION_BY_TYPE['file_duplicate'] },
        });
      }
      for (const row of dbDuplicateRows) {
        dispatch({
          type: 'SET_ROW_DECISION',
          payload: { rowNumber: row.rowNumber, action: DEFAULT_ACTION_BY_TYPE['db_duplicate'] },
        });
      }

      dispatch({ type: 'SET_PREVIEW', payload: preview });

      // Track preview loaded
      analytics.importV2PreviewLoaded({
        totalRows: preview.summary.total,
        validRows: preview.summary.valid,
        invalidRows: preview.summary.invalid,
        fileDuplicates: preview.summary.fileDuplicates,
        dbDuplicates: preview.summary.dbDuplicates,
      });

      // Track mapping stats
      const autoMapped = state.mapping.mappings.filter((m) => m.targetField && !m.isManual).length;
      const manualMapped = state.mapping.mappings.filter((m) => m.targetField && m.isManual).length;
      const unmapped = state.mapping.mappings.filter((m) => !m.targetField).length;
      analytics.importV2MappingCompleted({
        autoMappedCount: autoMapped,
        manualMappedCount: manualMapped,
        unmappedCount: unmapped,
      });

      nextStep();
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Erreur lors de la generation de l\'apercu',
      });
      analytics.importV2Failed({
        error: err instanceof Error ? err.message : 'Erreur lors de la generation de l\'apercu',
        phase: 'preview',
        fileType: state.parsedFile?.type,
      });
    } finally {
      dispatch({ type: 'SET_CHECKING_DUPLICATES', payload: false });
    }
  }, [state.parsedFile, state.mapping, dispatch, nextStep]);

  // ==========================================================================
  // STEP 2 HANDLERS - UNIFIED
  // ==========================================================================

  // Handle single row action change
  const handleRowActionChange = useCallback(
    (rowNumber: number, action: UnifiedRowAction) => {
      dispatch({ type: 'SET_ROW_DECISION', payload: { rowNumber, action } });
    },
    [dispatch]
  );

  // Handle bulk action for all rows of a specific issue type
  const handleBulkAction = useCallback(
    (issueType: PreviewIssueType, action: UnifiedRowAction) => {
      dispatch({ type: 'SET_ALL_ROW_DECISIONS', payload: { issueType, action } });
    },
    [dispatch]
  );

  // Handle opening the unified modal
  const handleViewEdit = useCallback(
    (row: IssueRow, issueType: PreviewIssueType) => {
      setModalState({
        isOpen: true,
        row,
        issueType,
      });
    },
    []
  );

  // Handle closing the modal
  const handleCloseModal = useCallback(() => {
    setModalState({
      isOpen: false,
      row: null,
      issueType: null,
    });
  }, []);

  // Handle saving edits from modal
  const handleSaveEdits = useCallback(
    (edits: Partial<Record<LeadFieldKey, string>>) => {
      if (!modalState.row) return;

      // Save each field update to the wizard state
      for (const [field, value] of Object.entries(edits)) {
        if (value !== undefined) {
          dispatch({
            type: 'SET_EDITED_ROW_FIELD',
            payload: { rowNumber: modalState.row.rowNumber, field: field as LeadFieldKey, value: value || '' },
          });
        }
      }
    },
    [modalState.row, dispatch]
  );

  // Handle action change from within the modal
  const handleModalActionChange = useCallback(
    (action: UnifiedRowAction) => {
      if (!modalState.row) return;
      dispatch({
        type: 'SET_ROW_DECISION',
        payload: { rowNumber: modalState.row.rowNumber, action },
      });
    },
    [modalState.row, dispatch]
  );

  // ==========================================================================
  // ASSIGNMENT HANDLERS
  // ==========================================================================

  const handleAssignmentToggle = useCallback(
    (enabled: boolean) => {
      dispatch({
        type: 'SET_ASSIGNMENT',
        payload: { mode: enabled ? 'round_robin' : 'none' },
      });
    },
    [dispatch]
  );

  const handleAssignmentUsersChange = useCallback(
    (userIds: string[]) => {
      dispatch({
        type: 'SET_ASSIGNMENT',
        payload: { selectedUserIds: userIds },
      });
    },
    [dispatch]
  );

  // ==========================================================================
  // CRITICAL: START IMPORT WITH FIXED EDIT MERGING
  // ==========================================================================

  const handleStartImport = useCallback(async () => {
    if (!state.parsedFile || !state.mapping) return;

    dispatch({ type: 'SET_IMPORTING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    nextStep();

    try {
      // Re-validate rows to get normalized data for the server
      const validationResults = validateRows(state.parsedFile.rows, state.mapping.mappings);

      // CRITICAL FIX: Apply user edits to ALL rows (not just invalid)
      // This ensures edits from file duplicates and DB duplicates are also merged
      const resultsWithEdits = validationResults.map((r) => {
        const edits = state.editedRows.get(r.rowNumber);
        const decision = state.rowDecisions.get(r.rowNumber);

        // If row has edits, merge them into normalized data
        if (edits && Object.keys(edits).length > 0) {
          const mergedData = { ...r.normalizedData, ...edits };

          // For invalid rows being imported, mark as valid
          if (!r.isValid && decision === 'import') {
            return {
              ...r,
              isValid: true,
              normalizedData: mergedData,
              errors: [], // Clear errors since user chose to import anyway
            };
          }

          return {
            ...r,
            normalizedData: mergedData,
          };
        }

        // For invalid rows being imported without edits, mark as valid
        if (!r.isValid && decision === 'import') {
          return {
            ...r,
            isValid: true,
            errors: [],
          };
        }

        return r;
      });

      // Detect file duplicates to know which rows are duplicates
      const validResults = resultsWithEdits.filter((r) => r.isValid);
      const fileDupeResult = detectFileDuplicates(validResults, ['email']);

      // Build set of file duplicate row numbers (non-first occurrences)
      // ONLY include rows where user chose 'skip' (or made no decision, defaulting to skip)
      // If user chose 'import', exclude from this set so the row gets imported
      const fileDuplicateRowNumbers = new Set(
        fileDupeResult.rows
          .filter((r) => r.isFileDuplicate && !r.isFirstOccurrence)
          .filter((r) => state.rowDecisions.get(r.validation.rowNumber) !== 'import')
          .map((r) => r.validation.rowNumber)
      );

      // Prepare validated rows for the server
      const validatedRows = resultsWithEdits.map((r) => ({
        rowNumber: r.rowNumber,
        isValid: r.isValid,
        normalizedData: r.normalizedData,
        isFileDuplicate: fileDuplicateRowNumbers.has(r.rowNumber),
      }));

      // Convert rowDecisions Map to array for serialization
      const rowDecisionsArray = Array.from(state.rowDecisions.entries());

      // Build DB duplicate info array from preview data
      const dbDuplicateInfo = state.preview?.dbDuplicateRows.map((row) => ({
        rowNumber: row.rowNumber,
        matchedField: row.matchedField,
        matchedValue: row.matchedValue,
        existingLeadId: row.existingLead.id,
      })) || [];

      // Call server action with unified row decisions
      const result = await startImportV2({
        fileName: state.parsedFile.name,
        fileType: state.parsedFile.type,
        totalRows: state.parsedFile.rowCount,
        validatedRows,
        mappings: state.mapping.mappings,
        assignment: state.assignment,
        duplicates: state.duplicates,
        rowActions: rowDecisionsArray, // Now contains all row decisions
        dbDuplicateInfo,
        defaultStatus: state.defaultStatus,
        defaultSource: state.defaultSource || state.parsedFile.name,
      });

      if (result.success && result.results) {
        dispatch({ type: 'SET_RESULTS', payload: result.results });
        if (result.importJobId) {
          dispatch({ type: 'SET_IMPORT_JOB_ID', payload: result.importJobId });
        }

        // Track import completed
        analytics.importV2Completed({
          totalRows: result.results.totalRows,
          imported: result.results.importedCount,
          updated: result.results.updatedCount,
          skipped: result.results.skippedCount,
          errors: result.results.errorCount,
          durationMs: result.results.durationMs,
          fileType: state.parsedFile.type,
        });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Erreur lors de l\'import' });
        analytics.importV2Failed({
          error: result.error || 'Erreur lors de l\'import',
          phase: 'import',
          fileType: state.parsedFile.type,
        });
      }
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Erreur lors de l\'import',
      });
      analytics.importV2Failed({
        error: err instanceof Error ? err.message : 'Erreur lors de l\'import',
        phase: 'import',
        fileType: state.parsedFile?.type,
      });
    } finally {
      dispatch({ type: 'SET_IMPORTING', payload: false });
    }
  }, [state.parsedFile, state.mapping, state.rowDecisions, state.editedRows, state.assignment, state.duplicates, state.defaultStatus, state.defaultSource, state.preview, dispatch, nextStep]);

  // ==========================================================================
  // STEP 3 HANDLERS
  // ==========================================================================

  const handleViewLeads = useCallback(() => {
    router.push('/leads');
  }, [router]);

  const handleNewImport = useCallback(() => {
    reset();
  }, [reset]);

  const handleDownloadReport = useCallback(() => {
    if (!state.results) return;

    // Generate CSV report
    const lines: string[] = [];
    lines.push('Ligne,Email,Telephone,Nom,Statut,Raison');

    const allRows = [
      ...state.results.importedRows.map((r) => ({ ...r, statusLabel: 'Importe' })),
      ...state.results.updatedRows.map((r) => ({ ...r, statusLabel: 'Mis a jour' })),
      ...state.results.skippedRows.map((r) => ({ ...r, statusLabel: 'Ignore' })),
      ...state.results.errorRows.map((r) => ({ ...r, statusLabel: 'Erreur' })),
    ].sort((a, b) => a.rowNumber - b.rowNumber);

    for (const row of allRows) {
      const name = [row.displayData.firstName, row.displayData.lastName]
        .filter(Boolean)
        .join(' ');
      const line = [
        row.rowNumber,
        row.displayData.email || '',
        row.displayData.phone || '',
        name,
        row.statusLabel,
        row.reason || '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',');
      lines.push(line);
    }

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.results]);

  const handleCancelImport = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: 'Import annule' });
    dispatch({ type: 'SET_IMPORTING', payload: false });
  }, [dispatch]);

  // ==========================================================================
  // MODAL DATA
  // ==========================================================================

  const currentRowAction = useMemo(() => {
    if (!modalState.row || !modalState.issueType) return 'skip' as UnifiedRowAction;
    return state.rowDecisions.get(modalState.row.rowNumber) || DEFAULT_ACTION_BY_TYPE[modalState.issueType];
  }, [modalState.row, modalState.issueType, state.rowDecisions]);

  const currentRowEdits = useMemo(() => {
    if (!modalState.row) return {};
    return state.editedRows.get(modalState.row.rowNumber) || {};
  }, [modalState.row, state.editedRows]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="max-w-5xl mx-auto">
      {/* Stepper */}
      <Stepper currentStep={state.currentStep} completedSteps={completedSteps} />

      {/* Step 1: Upload & Mapping */}
      {state.currentStep === 'upload' && (
        <UploadStep
          parsedFile={state.parsedFile}
          mapping={state.mapping}
          isParsing={isParsing || state.isParsing}
          isCheckingDuplicates={state.isCheckingDuplicates}
          parseError={parseError || state.error}
          onFileSelect={handleFileSelect}
          onFileClear={handleFileClear}
          onMappingChange={handleMappingChange}
          onNext={handleUploadNext}
          canProceed={canProceedToPreview}
        />
      )}

      {/* Step 2: Preview & Configuration */}
      {state.currentStep === 'preview' && state.preview && (
        <>
          <PreviewStep
            preview={state.preview}
            isLoading={state.isCheckingDuplicates}
            rowDecisions={state.rowDecisions}
            editedRows={state.editedRows}
            onRowActionChange={handleRowActionChange}
            onBulkAction={handleBulkAction}
            onViewEdit={handleViewEdit}
            onStartImport={handleStartImport}
            onBack={prevStep}
            canImport={canProceedToImport}
            isImporting={state.isImporting}
            salesUsers={salesUsers}
            assignmentMode={state.assignment.mode}
            assignmentUserIds={state.assignment.selectedUserIds}
            onAssignmentToggle={handleAssignmentToggle}
            onAssignmentUsersChange={handleAssignmentUsersChange}
            dbCheckWarning={dbCheckWarning}
          />

          {/* Unified Modal */}
          {modalState.row && modalState.issueType && state.mapping && (
            <UnifiedRowModal
              isOpen={modalState.isOpen}
              onClose={handleCloseModal}
              issueType={modalState.issueType}
              rowNumber={modalState.row.rowNumber}
              row={modalState.row}
              currentAction={currentRowAction}
              currentEdits={currentRowEdits}
              mappings={state.mapping.mappings}
              onActionChange={handleModalActionChange}
              onSave={handleSaveEdits}
            />
          )}
        </>
      )}

      {/* Step 3: Import Progress & Results */}
      {state.currentStep === 'import' && (
        <ImportStep
          progress={state.progress}
          results={state.results}
          error={state.error}
          isImporting={state.isImporting && !state.results && !state.error}
          onViewLeads={handleViewLeads}
          onNewImport={handleNewImport}
          onDownloadReport={handleDownloadReport}
          onCancel={handleCancelImport}
        />
      )}
    </div>
  );
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

interface ImportWizardV2Props {
  salesUsers: SalesUser[];
}

export function ImportWizardV2({ salesUsers }: ImportWizardV2Props) {
  return (
    <ImportWizardProvider>
      <WizardContent salesUsers={salesUsers} />
    </ImportWizardProvider>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

export function ImportWizardV2Skeleton() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Stepper skeleton */}
      <div className="flex items-center justify-center mb-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-border dark:bg-darkborder" />
              <div className="h-4 w-16 bg-border dark:bg-darkborder rounded" />
            </div>
            {i < 3 && (
              <div className="w-8 md:w-12 h-px mx-3 bg-border dark:bg-darkborder" />
            )}
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <UploadStepSkeleton />
    </div>
  );
}
