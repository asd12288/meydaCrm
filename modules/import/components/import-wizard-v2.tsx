'use client';

import { useState, useEffect } from 'react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconUpload,
  IconAlertCircle,
  IconLoader2,
  IconX,
} from '@tabler/icons-react';
import { ErrorBoundary, SectionErrorFallback } from '@/modules/shared';
import { Button } from '@/components/ui/button';

// Step components
import { WizardStepper } from './wizard-stepper';
import { UploadStep } from './upload-step';
import { MappingStep } from './mapping-step';
import { OptionsStep } from './options-step';
import { PreviewStep } from './preview-step';
import { ProgressStep } from './progress-step';
import { ResultsStep } from './results-step';
import { UploadProgressOverlay } from './upload-progress-overlay';

// Hooks
import { useImportWizard } from '../hooks/use-import-wizard';
import { useImportSSE } from '../hooks/use-import-sse';

// Actions
import { uploadFileWithProgress } from '../lib/client-upload';
import type { UploadProgress } from '../lib/client-upload';
import {
  updateImportJobMapping,
  updateImportJobOptions,
  startImportParsing,
  startImportCommit,
  cancelImportJob,
  checkDatabaseDuplicates,
} from '../lib/actions';

// Types
import type { SalesUser } from '@/modules/leads/types';
import type { ImportWizardStep } from '../config/constants';
import type { DetailedValidationSummary } from '../types';

const LOG_PREFIX = '[ImportWizardV2]';

interface ImportWizardV2Props {
  salesUsers: SalesUser[];
  onImportComplete?: (importJobId: string) => void;
}

/**
 * Import Wizard V2
 * 6-step wizard with SSE real-time updates
 * Steps: upload -> mapping -> options -> preview -> progress -> results
 */
export function ImportWizardV2({ salesUsers, onImportComplete }: ImportWizardV2Props) {
  console.log(LOG_PREFIX, 'Component rendered');
  const wizard = useImportWizard();

  // Local state
  const [currentStep, setCurrentStep] = useState<ImportWizardStep>('upload');
  const [completedSteps, setCompletedSteps] = useState<ImportWizardStep[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Store final progress for results step (SSE clears progress when disabled)
  const [finalProgress, setFinalProgress] = useState<import('../types').ImportJobProgress | null>(null);
  // Detailed validation with DB duplicate check
  const [detailedValidation, setDetailedValidation] = useState<DetailedValidationSummary | null>(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  // SSE for real-time progress
  console.log(LOG_PREFIX, 'Setting up SSE', { currentStep, importJobId: wizard.state.importJobId });
  const {
    progress: sseProgress,
    isConnected,
    error: sseError,
    reconnect,
  } = useImportSSE({
    jobId: currentStep === 'progress' ? wizard.state.importJobId : null,
    enabled: currentStep === 'progress',
    onProgress: (progress) => {
      console.log(LOG_PREFIX, 'SSE onProgress', { status: progress.status, importedRows: progress.importedRows });
    },
    onComplete: (progress) => {
      console.log(LOG_PREFIX, 'SSE onComplete', progress);
      // Save the final progress before transitioning (SSE will clear progress when disabled)
      setFinalProgress(progress);
      setCurrentStep('results');
      setCompletedSteps((prev) => [...prev, 'progress']);
      if (wizard.state.importJobId && onImportComplete) {
        onImportComplete(wizard.state.importJobId);
      }
    },
    onError: (err) => {
      console.error(LOG_PREFIX, 'SSE onError', err);
      setError(err);
    },
  });

  const {
    state,
    fileToUpload,
    conversionProgress,
  } = wizard;

  // Get sample rows for mapping step
  const sampleRows = state.file?.sampleData || [];

  // Step navigation helpers
  const stepOrder: ImportWizardStep[] = ['upload', 'mapping', 'options', 'preview', 'progress', 'results'];
  const currentStepIndex = stepOrder.indexOf(currentStep);

  const canGoBack = currentStepIndex > 0 && currentStep !== 'progress' && currentStep !== 'results';

  const canGoNext = (() => {
    switch (currentStep) {
      case 'upload':
        return !!state.file && !!state.mapping;
      case 'mapping':
        return state.mapping?.mappings.some((m) => m.targetField !== null);
      case 'options':
        // Validate assignment config
        if (state.assignment.mode === 'round_robin') {
          if (!state.assignment.roundRobinUserIds || state.assignment.roundRobinUserIds.length < 2) return false;
        }
        if (state.assignment.mode === 'by_column' && !state.assignment.assignmentColumn) return false;
        return true;
      case 'preview':
        // Must have processable rows AND job not already completed
        if (!detailedValidation) return false;
        if (detailedValidation.jobStatus === 'completed') return false;
        // Calculate processable rows based on duplicate strategy
        // - 'skip': only base valid rows
        // - 'update'/'create': valid rows + db duplicates (they will be processed)
        const baseValid = detailedValidation.valid;
        const dbDuplicates = detailedValidation.dbDuplicates;
        const processableRows = state.duplicates.strategy === 'skip'
          ? baseValid
          : baseValid + dbDuplicates;
        return processableRows > 0;
      default:
        return false;
    }
  })();

  // Navigate to step
  const goToStep = (step: ImportWizardStep) => {
    console.log(LOG_PREFIX, 'goToStep', { from: currentStep, to: step });
    if (completedSteps.includes(step) || step === currentStep) {
      setCurrentStep(step);
    }
  };

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < stepOrder.length) {
      console.log(LOG_PREFIX, 'goNext', { from: currentStep, to: stepOrder[nextIndex] });
      setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
      setCurrentStep(stepOrder[nextIndex]);
    }
  };

  const goPrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      console.log(LOG_PREFIX, 'goPrevious', { from: currentStep, to: stepOrder[prevIndex] });
      setCurrentStep(stepOrder[prevIndex]);
    }
  };

  // Auto-advance to mapping step when file and mapping are ready
  useEffect(() => {
    // Only auto-advance if:
    // 1. We're on the upload step
    // 2. File is loaded
    // 3. Mapping is ready (auto-detection complete)
    // 4. Not already processing
    if (
      currentStep === 'upload' &&
      state.file &&
      state.mapping &&
      !isProcessing
    ) {
      // Small delay to show the user the file was detected
      const timer = setTimeout(() => {
        handleUploadComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Auto-advance runs once when conditions are met
  }, [currentStep, state.file, state.mapping, isProcessing]);

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    console.log(LOG_PREFIX, 'handleFileSelect', { fileName: file.name, fileSize: file.size });
    setError(null);
    await wizard.handleFileSelect(file);
  };

  // Handle clear file
  const handleClearFile = () => {
    console.log(LOG_PREFIX, 'handleClearFile - resetting all import state');
    wizard.clearFile(); // This now also resets importJobId
    setCurrentStep('upload');
    setCompletedSteps([]);
    setError(null);
    setDetailedValidation(null); // Clear stale validation data
    setFinalProgress(null);
  };

  // Handle upload and move to mapping
  const handleUploadComplete = async () => {
    console.log(LOG_PREFIX, 'handleUploadComplete START', { hasFile: !!fileToUpload, hasState: !!state.file, importJobId: state.importJobId });
    if (!fileToUpload || !state.file) {
      console.log(LOG_PREFIX, 'handleUploadComplete SKIP - no file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Upload file if not already uploaded
      if (!state.importJobId) {
        console.log(LOG_PREFIX, 'Uploading file to storage...');
        const result = await uploadFileWithProgress(fileToUpload, (progress) => {
          console.log(LOG_PREFIX, 'Upload progress', progress);
          setUploadProgress(progress);
        });

        console.log(LOG_PREFIX, 'Upload result', result);
        if (!result.success) {
          console.error(LOG_PREFIX, 'Upload failed:', result.error);
          setError(result.error || 'Erreur lors du telechargement');
          setUploadProgress(null);
          setIsProcessing(false);
          return;
        }

        wizard.setImportJobId(result.importJobId!);
        setTimeout(() => setUploadProgress(null), 500);
      } else {
        console.log(LOG_PREFIX, 'File already uploaded, importJobId:', state.importJobId);
      }

      console.log(LOG_PREFIX, 'handleUploadComplete SUCCESS, going to next step');
      goNext();
    } catch (err) {
      console.error(LOG_PREFIX, 'handleUploadComplete ERROR:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du telechargement');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle save mapping
  const handleSaveMapping = async () => {
    console.log(LOG_PREFIX, 'handleSaveMapping START', { importJobId: state.importJobId });
    if (!state.importJobId || !state.mapping) {
      console.log(LOG_PREFIX, 'handleSaveMapping SKIP - no importJobId or mapping');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log(LOG_PREFIX, 'Saving mapping to database...');
      const result = await updateImportJobMapping(state.importJobId, state.mapping);
      console.log(LOG_PREFIX, 'Save mapping result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la sauvegarde du mapping');
      }

      console.log(LOG_PREFIX, 'handleSaveMapping SUCCESS');
      goNext();
    } catch (err) {
      console.error(LOG_PREFIX, 'handleSaveMapping ERROR:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle save options
  const handleSaveOptions = async () => {
    console.log(LOG_PREFIX, 'handleSaveOptions START', { importJobId: state.importJobId });
    if (!state.importJobId) {
      console.log(LOG_PREFIX, 'handleSaveOptions SKIP - no importJobId');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setDetailedValidation(null);

    try {
      // Save options to the job
      console.log(LOG_PREFIX, 'Saving options to database...', { assignment: state.assignment, duplicates: state.duplicates });
      const result = await updateImportJobOptions(state.importJobId, {
        assignmentConfig: state.assignment,
        duplicateConfig: state.duplicates,
      });
      console.log(LOG_PREFIX, 'Save options result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la sauvegarde des options');
      }

      // Move to preview step first
      console.log(LOG_PREFIX, 'Moving to preview step');
      goNext();
      setIsCheckingDuplicates(true);

      // Check current job status - skip parsing if already ready or completed
      console.log(LOG_PREFIX, 'Checking current job status...');
      const { pollImportJobStatus } = await import('../lib/actions');
      const currentStatus = await pollImportJobStatus(state.importJobId);
      const jobStatus = currentStatus.data?.status;
      console.log(LOG_PREFIX, 'Current job status:', jobStatus);

      // Only start parsing if job is not already ready, completed, or importing
      // (ready = parsed, completed = already imported, importing = commit in progress)
      const skipParsingStatuses = ['ready', 'completed', 'importing'];
      if (!skipParsingStatuses.includes(jobStatus || '')) {
        console.log(LOG_PREFIX, 'Starting parsing via QStash...');
        const parseResult = await startImportParsing(state.importJobId);
        console.log(LOG_PREFIX, 'Parse start result:', parseResult);
        if (!parseResult.success) {
          throw new Error(parseResult.error || 'Erreur lors du demarrage du parsing');
        }

        // Poll for parsing to complete
        // Valid end states: ready (parsed), completed (done), importing (commit started)
        console.log(LOG_PREFIX, 'Polling for parsing completion...');
        let attempts = 0;
        const maxAttempts = 120; // 120 seconds max for large files
        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;

          const statusResult = await pollImportJobStatus(state.importJobId);
          const status = statusResult.data?.status;
          console.log(LOG_PREFIX, `Poll attempt ${attempts}:`, status);

          if (!statusResult.success) {
            throw new Error(statusResult.error || 'Erreur lors de la verification du statut');
          }

          // Any of these means parsing is done
          if (status === 'ready' || status === 'completed' || status === 'importing') {
            console.log(LOG_PREFIX, 'Parsing complete, status:', status);
            break;
          }

          if (status === 'failed') {
            throw new Error(statusResult.data?.errorMessage || 'Erreur lors du parsing');
          }
        }

        if (attempts >= maxAttempts) {
          throw new Error('Le parsing prend trop de temps');
        }
      } else {
        console.log(LOG_PREFIX, 'Skipping parsing, job already in status:', jobStatus);
      }

      // Now check database duplicates (always re-check in case options changed)
      console.log(LOG_PREFIX, 'Checking database duplicates...');
      const dupeResult = await checkDatabaseDuplicates(state.importJobId);
      console.log(LOG_PREFIX, 'Duplicate check result:', dupeResult);

      if (!dupeResult.success || !dupeResult.data) {
        throw new Error(dupeResult.error || 'Erreur lors de la verification des doublons');
      }

      setDetailedValidation(dupeResult.data);

      // Also update wizard validation summary for canGoNext check
      wizard.setValidationFromServer({
        totalRows: dupeResult.data.total,
        validRows: dupeResult.data.valid,
        invalidRows: dupeResult.data.invalid,
      });
      console.log(LOG_PREFIX, 'handleSaveOptions COMPLETE');
    } catch (err) {
      console.error(LOG_PREFIX, 'handleSaveOptions ERROR:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setIsProcessing(false);
      setIsCheckingDuplicates(false);
    }
  };

  // Handle start import (commit phase - parsing already done in preview)
  const handleStartImport = async () => {
    console.log(LOG_PREFIX, 'handleStartImport START', { importJobId: state.importJobId });
    if (!state.importJobId) {
      console.log(LOG_PREFIX, 'handleStartImport SKIP - no importJobId');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Start commit phase (parsing already done in preview step)
      console.log(LOG_PREFIX, 'Starting commit via QStash...');
      const result = await startImportCommit(state.importJobId, {
        assignment: state.assignment,
        duplicates: state.duplicates,
      });
      console.log(LOG_PREFIX, 'Commit start result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors du demarrage de l\'import');
      }

      console.log(LOG_PREFIX, 'handleStartImport SUCCESS, moving to progress step');
      goNext(); // Move to progress step - SSE will take over
    } catch (err) {
      console.error(LOG_PREFIX, 'handleStartImport ERROR:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du demarrage');
      setIsProcessing(false);
    }
  };

  // Handle cancel import
  const handleCancelImport = async () => {
    console.log(LOG_PREFIX, 'handleCancelImport', { importJobId: state.importJobId });
    if (!state.importJobId) return;

    try {
      console.log(LOG_PREFIX, 'Cancelling import job...');
      await cancelImportJob(state.importJobId);
      console.log(LOG_PREFIX, 'Import cancelled');
      // Reset UI to start fresh
      handleNewImport();
    } catch (err) {
      console.error(LOG_PREFIX, 'Cancel error:', err);
      // Even if cancel fails, allow user to start fresh
      handleNewImport();
    }
  };

  // Handle view leads
  const handleViewLeads = () => {
    window.location.href = `/leads?import_job_id=${state.importJobId}`;
  };

  // Handle new import
  const handleNewImport = () => {
    wizard.reset();
    setCurrentStep('upload');
    setCompletedSteps([]);
    setError(null);
    setIsProcessing(false);
    setUploadProgress(null);
    setFinalProgress(null);
    setDetailedValidation(null);
    setIsCheckingDuplicates(false);
  };

  // Render step content
  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <UploadStep
            file={state.file}
            onFileSelect={handleFileSelect}
            onClear={handleClearFile}
            error={error}
            isProcessing={isProcessing}
            conversionProgress={conversionProgress}
          />
        );

      case 'mapping':
        if (!state.file || !state.mapping) return null;
        return (
          <MappingStep
            file={state.file}
            mapping={state.mapping}
            sampleRows={sampleRows}
            onUpdateMapping={wizard.updateColumnMapping}
            onResetMapping={wizard.resetMapping}
            isComplete={state.mapping.mappings.some((m) =>
              ['email', 'phone', 'external_id'].includes(m.targetField || '')
            )}
          />
        );

      case 'options':
        // Get all source columns from the file for by_column assignment
        const availableColumns = state.mapping?.mappings.map(m => m.sourceColumn) || [];
        return (
          <OptionsStep
            assignment={state.assignment}
            duplicateConfig={state.duplicates}
            salesUsers={salesUsers}
            availableColumns={availableColumns}
            onUpdateAssignment={wizard.updateAssignment}
            onUpdateDuplicates={wizard.updateDuplicates}
          />
        );

      case 'preview':
        return (
          <PreviewStep
            file={state.file!}
            detailedSummary={detailedValidation}
            isChecking={isCheckingDuplicates}
            importJobId={state.importJobId}
            duplicateStrategy={state.duplicates.strategy}
          />
        );

      case 'progress':
        // If no SSE data yet, show connecting state
        if (!sseProgress) {
          return (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <IconLoader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="text-center">
                <h3 className="text-lg font-medium text-ld">Demarrage de l&apos;import...</h3>
                <p className="text-sm text-darklink mt-1">Connexion au serveur</p>
              </div>
            </div>
          );
        }

        // Convert SSE progress to ImportProgress format for ProgressStep
        const progressData = {
          phase: sseProgress.status as 'parsing' | 'importing' | 'completed' | 'failed',
          totalRows: sseProgress.totalRows || 0,
          processedRows: sseProgress.processedRows || 0,
          validRows: sseProgress.validRows || 0,
          invalidRows: sseProgress.invalidRows || 0,
          importedRows: sseProgress.importedRows || 0,
          skippedRows: sseProgress.skippedRows || 0,
          currentChunk: sseProgress.currentChunk || 0,
          totalChunks: sseProgress.totalChunks || 0,
          errorMessage: sseProgress.errorMessage || undefined,
        };

        return (
          <ProgressStep
            progress={progressData}
            fileName={state.file?.name}
          />
        );

      case 'results':
        // Use finalProgress (saved when onComplete fired) since SSE clears progress when disabled
        if (!finalProgress) return null;
        return (
          <ResultsStep
            progress={finalProgress}
            fileName={state.file?.name || 'import.csv'}
            importJobId={state.importJobId || ''}
            onViewLeads={handleViewLeads}
            onNewImport={handleNewImport}
          />
        );

      default:
        return null;
    }
  };

  // Determine action button
  const renderActionButton = () => {
    if (currentStep === 'progress' || currentStep === 'results') {
      return null; // Actions handled within step components
    }

    const buttonConfigs: Record<ImportWizardStep, { label: string; onClick: () => void; icon?: React.ReactNode }> = {
      upload: {
        label: 'Continuer vers le mapping',
        onClick: handleUploadComplete,
        icon: <IconChevronRight size={18} />,
      },
      mapping: {
        label: 'Continuer vers les options',
        onClick: handleSaveMapping,
        icon: <IconChevronRight size={18} />,
      },
      options: {
        label: 'Continuer vers l\'apercu',
        onClick: handleSaveOptions,
        icon: <IconChevronRight size={18} />,
      },
      preview: {
        label: 'Lancer l\'import',
        onClick: handleStartImport,
        icon: <IconUpload size={18} />,
      },
      progress: { label: '', onClick: () => {} },
      results: { label: '', onClick: () => {} },
    };

    const config = buttonConfigs[currentStep];

    return (
      <Button
        type="button"
        variant="primary"
        onClick={config.onClick}
        disabled={!canGoNext || isProcessing}
      >
        {isProcessing ? (
          <>
            <IconLoader2 size={18} className="animate-spin" />
            Traitement...
          </>
        ) : (
          <>
            {config.label}
            {config.icon}
          </>
        )}
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload progress overlay */}
      <UploadProgressOverlay progress={uploadProgress} fileName={fileToUpload?.name} />

      {/* Wizard stepper */}
      <WizardStepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        isProcessing={isProcessing || currentStep === 'progress'}
        onStepClick={goToStep}
      />

      {/* Error display */}
      {(error || sseError) && currentStep !== 'progress' && (
        <div className="flex items-start gap-3 p-4 bg-lighterror/30 border border-error/30 rounded-lg">
          <IconAlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-error">Erreur</p>
            <p className="text-sm text-error/80">{error || sseError}</p>
          </div>
        </div>
      )}

      {/* SSE connection status (during progress) */}
      {currentStep === 'progress' && !isConnected && (
        <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm">
          <IconAlertCircle size={16} className="text-warning" />
          <span className="text-warning">Connexion perdue</span>
          <Button
            variant="link"
            size="sm"
            onClick={reconnect}
            className="ml-auto"
          >
            Reconnecter
          </Button>
        </div>
      )}

      {/* Step content */}
      <div className="min-h-[400px]">
        <ErrorBoundary FallbackComponent={SectionErrorFallback}>
          {renderStep()}
        </ErrorBoundary>
      </div>

      {/* Navigation footer */}
      {currentStep !== 'progress' && currentStep !== 'results' && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            {canGoBack && (
              <Button
                type="button"
                variant="ghost"
                onClick={goPrevious}
                disabled={isProcessing}
              >
                <IconChevronLeft size={18} />
                Precedent
              </Button>
            )}
            {/* New Import button - shown on all steps except upload */}
            {currentStep !== 'upload' && (
              <Button
                type="button"
                variant="ghostDanger"
                onClick={handleNewImport}
                disabled={isProcessing}
              >
                <IconX size={18} />
                Nouvel import
              </Button>
            )}
          </div>

          <div>{renderActionButton()}</div>
        </div>
      )}

      {/* Cancel button during progress */}
      {currentStep === 'progress' && sseProgress?.status !== 'completed' && sseProgress?.status !== 'failed' && (
        <div className="flex justify-center pt-4 border-t border-border">
          <Button
            type="button"
            variant="ghostDanger"
            onClick={handleCancelImport}
          >
            <IconX size={18} />
            Annuler l&apos;import
          </Button>
        </div>
      )}
    </div>
  );
}
