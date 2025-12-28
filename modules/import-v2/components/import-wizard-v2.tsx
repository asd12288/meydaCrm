/**
 * Import Wizard V2 - Main Component
 *
 * 3-step import wizard:
 * 1. Upload & Map columns
 * 2. Preview & Configure (duplicates, distribution)
 * 3. Import & Results (progress, final summary)
 *
 * Refactored to use custom hooks for better maintainability.
 * Original: ~800 lines → Now: ~230 lines
 */

'use client';

import { IconCheck } from '@tabler/icons-react';
import { ErrorBoundary, ErrorFallback } from '@/modules/shared';

import { WIZARD_STEP_CONFIG } from '../config/constants';
import type { WizardStepV2 } from '../config/constants';
import { useImportWizard, ImportWizardProvider } from '../context';
import {
  useFileProcessing,
  usePreviewGeneration,
  usePreviewRowActions,
  useAssignmentConfig,
  useImportExecution,
  useResultsActions,
} from '../hooks';
import type { SalesUser } from '@/modules/leads/types';
import { UploadStep, UploadStepSkeleton } from './upload-step';
import { PreviewStep } from './preview-step';
import { ImportStep } from './import-step';
import { UnifiedRowModal } from './unified-row-modal';

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
// WIZARD CONTENT
// =============================================================================

interface WizardContentProps {
  salesUsers: SalesUser[];
  onComplete?: () => void;
}

function WizardContent({ salesUsers, onComplete }: WizardContentProps) {
  const { state, prevStep, canProceedToPreview, canProceedToImport } = useImportWizard();

  // Step 1: File processing
  const { handleFileSelect, handleFileClear, handleMappingChange, isParsing, parseError } =
    useFileProcessing();

  // Step 1 -> 2: Preview generation
  const { handleUploadNext, dbCheckWarning } = usePreviewGeneration();

  // Step 2: Row actions and modal
  const {
    modalState,
    currentRowAction,
    currentRowEdits,
    handleRowActionChange,
    handleBulkAction,
    handleViewEdit,
    handleCloseModal,
    handleSaveEdits,
    handleModalActionChange,
  } = usePreviewRowActions();

  // Step 2: Assignment config
  const { handleAssignmentToggle, handleAssignmentUsersChange } = useAssignmentConfig();

  // Step 2 -> 3: Import execution
  const { handleStartImport } = useImportExecution();

  // Step 3: Results actions
  const { handleViewLeads, handleNewImport, handleDownloadReport, handleCancelImport } =
    useResultsActions();

  // Wrap handleNewImport to call onComplete when starting new import
  const handleNewImportWithCallback = () => {
    handleNewImport();
    onComplete?.();
  };

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
  // RENDER
  // ==========================================================================

  return (
    <div className="max-w-5xl mx-auto">
      {/* Stepper */}
      <Stepper currentStep={state.currentStep} completedSteps={completedSteps} />

      {/* Step 1: Upload & Mapping */}
      {state.currentStep === 'upload' && (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
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
        </ErrorBoundary>
      )}

      {/* Step 2: Preview & Configuration */}
      {state.currentStep === 'preview' && state.preview && (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
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
        </ErrorBoundary>
      )}

      {/* Step 3: Import Progress & Results */}
      {state.currentStep === 'import' && (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <ImportStep
            progress={state.progress}
            results={state.results}
            error={state.error}
            isImporting={state.isImporting && !state.results && !state.error}
            onViewLeads={handleViewLeads}
            onNewImport={handleNewImportWithCallback}
            onDownloadReport={handleDownloadReport}
            onCancel={handleCancelImport}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

interface ImportWizardV2Props {
  salesUsers: SalesUser[];
  /** Callback when import is complete (success or user clicks "New import") */
  onComplete?: () => void;
}

export function ImportWizardV2({ salesUsers, onComplete }: ImportWizardV2Props) {
  return (
    <ImportWizardProvider>
      <WizardContent salesUsers={salesUsers} onComplete={onComplete} />
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
            {i < 3 && <div className="w-8 md:w-12 h-px mx-3 bg-border dark:bg-darkborder" />}
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <UploadStepSkeleton />
    </div>
  );
}
