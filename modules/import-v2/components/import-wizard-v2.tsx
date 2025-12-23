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
import {
  IconUpload,
  IconEye,
  IconFileImport,
  IconCheck,
} from '@tabler/icons-react';

import { WIZARD_STEP_CONFIG } from '../config/constants';
import { useImportWizard, ImportWizardProvider } from '../context';
import { useClientParser } from '../hooks';
import { validateRows } from '../lib/validators/row-validator';
import { detectFileDuplicates } from '../lib/processors';
import { startImportV2 } from '../lib/actions';
import { UploadStep, UploadStepSkeleton } from './upload-step';
import { PreviewStep, PreviewStepSkeleton } from './preview-step';
import { ImportStep, ImportStepSkeleton } from './import-step';
import { DuplicateComparisonModal } from './duplicate-comparison-modal';

import type { WizardStepV2, DuplicateStrategyV2 } from '../config/constants';
import type { LeadFieldKey } from '../../import/types/mapping';
import type {
  DbDuplicateRowV2,
  ComparisonDataV2,
  DetailedPreviewDataV2,
  InvalidRowV2,
  FileDuplicateRowV2,
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

  const getStepIcon = (step: WizardStepV2) => {
    if (completedSteps.includes(step)) {
      return <IconCheck size={20} />;
    }
    switch (step) {
      case 'upload':
        return <IconUpload size={20} />;
      case 'preview':
        return <IconEye size={20} />;
      case 'import':
        return <IconFileImport size={20} />;
    }
  };

  const getStepStatus = (step: WizardStepV2) => {
    if (completedSteps.includes(step)) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const config = WIZARD_STEP_CONFIG[step];
        const status = getStepStatus(step);

        return (
          <div key={step} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition-colors duration-200
                  ${status === 'completed' ? 'bg-success text-white' : ''}
                  ${status === 'current' ? 'bg-primary text-white' : ''}
                  ${status === 'pending' ? 'bg-lightgray dark:bg-darkgray text-darklink' : ''}
                `}
              >
                {getStepIcon(step)}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={`text-sm font-medium ${
                    status === 'current' ? 'text-primary' : 'text-ld'
                  }`}
                >
                  {config.label}
                </p>
                <p className="text-xs text-darklink hidden md:block">
                  {config.description}
                </p>
              </div>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  w-16 md:w-24 h-0.5 mx-2 mt-[-1.5rem]
                  ${completedSteps.includes(step) ? 'bg-success' : 'bg-border dark:bg-darkborder'}
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
// WIZARD CONTENT
// =============================================================================

function WizardContent() {
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

  // Comparison modal state
  const [compareRow, setCompareRow] = useState<DbDuplicateRowV2 | null>(null);

  // Convert DbDuplicateRowV2 to ComparisonDataV2 for modal
  const comparisonData: ComparisonDataV2 | null = useMemo(() => {
    if (!compareRow) return null;
    return {
      rowNumber: compareRow.rowNumber,
      fileData: {
        email: compareRow.displayData.email,
        phone: compareRow.displayData.phone,
        firstName: compareRow.displayData.firstName,
        lastName: compareRow.displayData.lastName,
        company: compareRow.displayData.company,
      },
      existingData: compareRow.existingLead,
      changedFields: compareRow.changedFields,
      rowAction: state.rowActions.get(compareRow.rowNumber) || 'skip',
      matchedField: compareRow.matchedField,
      matchedValue: compareRow.matchedValue,
    };
  }, [compareRow, state.rowActions]);

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
        }
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Erreur de parsing' });
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
      const fileDupeResult = detectFileDuplicates(validResults, ['email', 'phone', 'external_id']);

      // 3. Build preview data - Invalid rows
      const invalidRows: InvalidRowV2[] = validationResults
        .filter((r) => !r.isValid)
        .map((r) => ({
          rowNumber: r.rowNumber,
          issueType: 'invalid' as const,
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
      // Use the already-typed FileDuplicateRowV2[] from duplicateGroups
      const fileDuplicateRows: FileDuplicateRowV2[] = fileDupeResult.duplicateGroups
        .flatMap((group) => group.rows)
        .filter((r) => !r.isFirstOccurrence);

      // For now, skip DB duplicate detection (would require API call)
      // TODO: Add DB duplicate check via API
      const dbDuplicateRows: DbDuplicateRowV2[] = [];

      // Valid = all valid rows minus file duplicates (non-first occurrences)
      const validCount = validResults.length - fileDuplicateRows.length;

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
          willUpdate: 0,
          willSkip: invalidRows.length + fileDuplicateRows.length,
          willError: 0,
        },
        invalidRows,
        fileDuplicateRows,
        dbDuplicateRows,
      };

      dispatch({ type: 'SET_PREVIEW', payload: preview });
      nextStep();
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Erreur lors de la generation de l\'apercu',
      });
    } finally {
      dispatch({ type: 'SET_CHECKING_DUPLICATES', payload: false });
    }
  }, [state.parsedFile, state.mapping, dispatch, nextStep]);

  // ==========================================================================
  // STEP 2 HANDLERS
  // ==========================================================================

  const handleRowActionChange = useCallback(
    (rowNumber: number, action: DuplicateStrategyV2) => {
      dispatch({ type: 'SET_ROW_ACTION', payload: { rowNumber, action } });
    },
    [dispatch]
  );

  const handleBulkAction = useCallback(
    (action: DuplicateStrategyV2) => {
      dispatch({ type: 'SET_ALL_ROW_ACTIONS', payload: action });
    },
    [dispatch]
  );

  const handleCompareClick = useCallback((row: DbDuplicateRowV2) => {
    setCompareRow(row);
  }, []);

  const handleCloseCompare = useCallback(() => {
    setCompareRow(null);
  }, []);

  const handleStartImport = useCallback(async () => {
    if (!state.parsedFile || !state.mapping) return;

    dispatch({ type: 'SET_IMPORTING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    nextStep();

    try {
      // Re-validate rows to get normalized data for the server
      const validationResults = validateRows(state.parsedFile.rows, state.mapping.mappings);

      // Detect file duplicates to mark which rows to skip
      const validResults = validationResults.filter((r) => r.isValid);
      const fileDupeResult = detectFileDuplicates(validResults, ['email', 'phone', 'external_id']);

      // Build set of file duplicate row numbers (non-first occurrences)
      const fileDuplicateRowNumbers = new Set(
        fileDupeResult.rows
          .filter((r) => r.isFileDuplicate && !r.isFirstOccurrence)
          .map((r) => r.validation.rowNumber)
      );

      // Prepare validated rows for the server
      const validatedRows = validationResults.map((r) => ({
        rowNumber: r.rowNumber,
        isValid: r.isValid,
        normalizedData: r.normalizedData,
        isFileDuplicate: fileDuplicateRowNumbers.has(r.rowNumber),
      }));

      // Convert rowActions Map to array for serialization
      const rowActionsArray = Array.from(state.rowActions.entries());

      // Call server action
      const result = await startImportV2({
        fileName: state.parsedFile.name,
        fileType: state.parsedFile.type,
        totalRows: state.parsedFile.rowCount,
        validatedRows,
        mappings: state.mapping.mappings,
        assignment: state.assignment,
        duplicates: state.duplicates,
        rowActions: rowActionsArray,
        defaultStatus: state.defaultStatus,
        defaultSource: state.defaultSource || state.parsedFile.name,
      });

      if (result.success && result.results) {
        dispatch({ type: 'SET_RESULTS', payload: result.results });
        if (result.importJobId) {
          dispatch({ type: 'SET_IMPORT_JOB_ID', payload: result.importJobId });
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Erreur lors de l\'import' });
      }
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Erreur lors de l\'import',
      });
    } finally {
      dispatch({ type: 'SET_IMPORTING', payload: false });
    }
  }, [state.parsedFile, state.mapping, state.rowActions, state.assignment, state.duplicates, state.defaultStatus, state.defaultSource, dispatch, nextStep]);

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
            rowActions={state.rowActions}
            onRowActionChange={handleRowActionChange}
            onBulkAction={handleBulkAction}
            onCompareClick={handleCompareClick}
            onStartImport={handleStartImport}
            onBack={prevStep}
            canImport={canProceedToImport}
            isImporting={state.isImporting}
          />

          {/* Comparison Modal */}
          <DuplicateComparisonModal
            isOpen={!!compareRow}
            onClose={handleCloseCompare}
            data={comparisonData}
            onActionSelect={(rowNumber: number, action: DuplicateStrategyV2) => {
              handleRowActionChange(rowNumber, action);
              handleCloseCompare();
            }}
          />
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

export function ImportWizardV2() {
  return (
    <ImportWizardProvider>
      <WizardContent />
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
      <div className="flex items-center justify-center mb-8 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-border dark:bg-darkborder" />
              <div className="mt-2 space-y-1">
                <div className="h-4 w-16 bg-border dark:bg-darkborder rounded" />
                <div className="h-3 w-24 bg-border dark:bg-darkborder rounded hidden md:block" />
              </div>
            </div>
            {i < 3 && (
              <div className="w-16 md:w-24 h-0.5 mx-2 mt-[-1.5rem] bg-border dark:bg-darkborder" />
            )}
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <UploadStepSkeleton />
    </div>
  );
}
