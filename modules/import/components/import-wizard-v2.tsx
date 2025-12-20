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

// Types
import type { SalesUser } from '@/modules/leads/types';
import type { ImportWizardStep } from '../config/constants';

interface ImportWizardV2Props {
  salesUsers: SalesUser[];
  onImportComplete?: (importJobId: string) => void;
  /** Resume from an existing import job */
  resumeJobId?: string;
}

/**
 * Import Wizard V2
 * 6-step wizard with SSE real-time updates
 * Steps: upload -> mapping -> options -> preview -> progress -> results
 */
export function ImportWizardV2({ salesUsers, onImportComplete, resumeJobId }: ImportWizardV2Props) {
  const wizard = useImportWizard();

  // Local state
  const [currentStep, setCurrentStep] = useState<ImportWizardStep>('upload');
  const [completedSteps, setCompletedSteps] = useState<ImportWizardStep[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingResume, setIsLoadingResume] = useState(!!resumeJobId);

  // Load resume state
  useEffect(() => {
    if (!resumeJobId) return;

    const loadResumeState = async () => {
      try {
        setIsLoadingResume(true);
        setError(null);

        const response = await fetch(`/api/import/${resumeJobId}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Impossible de charger l\'import');
        }

        const { job } = await response.json();

        // Set the job ID in wizard state
        wizard.setImportJobId(job.id);

        // Restore mapping if available
        if (job.columnMapping) {
          // The wizard will need to restore mapping from the job
          // For now, we mark upload step as completed
        }

        // Restore assignment/duplicate config
        if (job.assignmentConfig) {
          wizard.updateAssignment(job.assignmentConfig);
        }
        if (job.duplicateConfig) {
          wizard.updateDuplicates(job.duplicateConfig);
        }

        // Determine which step to resume at based on ui_state
        const uiState = job.uiState;
        let resumeStep: ImportWizardStep = 'upload';
        const completedStepsToSet: ImportWizardStep[] = [];

        if (uiState) {
          // Map numeric step to step ID
          const stepMap: Record<number, ImportWizardStep> = {
            1: 'upload',
            2: 'mapping',
            3: 'options',
            4: 'preview',
            5: 'progress',
            6: 'results',
          };

          if (uiState.currentStep && uiState.currentStep > 1) {
            // Resume at the saved step
            resumeStep = stepMap[uiState.currentStep] || 'upload';

            // Mark previous steps as completed
            for (let i = 1; i < uiState.currentStep; i++) {
              completedStepsToSet.push(stepMap[i]);
            }
          }

          // If mapping/options are confirmed, mark those as completed
          if (uiState.mappingConfirmed) {
            if (!completedStepsToSet.includes('upload')) completedStepsToSet.push('upload');
            if (!completedStepsToSet.includes('mapping')) completedStepsToSet.push('mapping');
          }
          if (uiState.optionsConfirmed) {
            if (!completedStepsToSet.includes('options')) completedStepsToSet.push('options');
          }
        }

        // Check job status to determine appropriate step
        if (['queued', 'parsing', 'importing'].includes(job.status)) {
          resumeStep = 'progress';
        } else if (job.status === 'completed') {
          resumeStep = 'results';
        } else if (job.status === 'ready' || job.status === 'validating') {
          resumeStep = 'preview';
        }

        setCurrentStep(resumeStep);
        setCompletedSteps(completedStepsToSet);

        console.log(`[Resume] Loaded job ${job.id}, resuming at step: ${resumeStep}`);
      } catch (err) {
        console.error('Failed to load resume state:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setIsLoadingResume(false);
      }
    };

    loadResumeState();
  }, [resumeJobId]);

  // SSE for real-time progress
  const {
    progress: sseProgress,
    isConnected,
    error: sseError,
    reconnect,
  } = useImportSSE({
    jobId: currentStep === 'progress' ? wizard.state.importJobId : null,
    enabled: currentStep === 'progress',
    onComplete: () => {
      setCurrentStep('results');
      setCompletedSteps((prev) => [...prev, 'progress']);
      if (wizard.state.importJobId && onImportComplete) {
        onImportComplete(wizard.state.importJobId);
      }
    },
    onError: (err) => {
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
        if (state.assignment.mode === 'single' && !state.assignment.singleUserId) return false;
        if (state.assignment.mode === 'round_robin') {
          if (!state.assignment.roundRobinUserIds || state.assignment.roundRobinUserIds.length < 2) return false;
        }
        return true;
      case 'preview':
        return state.validationSummary.valid > 0;
      default:
        return false;
    }
  })();

  // Navigate to step
  const goToStep = (step: ImportWizardStep) => {
    if (completedSteps.includes(step) || step === currentStep) {
      setCurrentStep(step);
    }
  };

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < stepOrder.length) {
      setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
      setCurrentStep(stepOrder[nextIndex]);
    }
  };

  const goPrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
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
    // 5. Not resuming from a previous job
    if (
      currentStep === 'upload' &&
      state.file &&
      state.mapping &&
      !isProcessing &&
      !isLoadingResume &&
      !resumeJobId
    ) {
      // Small delay to show the user the file was detected
      const timer = setTimeout(() => {
        handleUploadComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, state.file, state.mapping, isProcessing, isLoadingResume, resumeJobId]);

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    setError(null);
    await wizard.handleFileSelect(file);
  };

  // Handle clear file
  const handleClearFile = () => {
    wizard.clearFile();
    setCurrentStep('upload');
    setCompletedSteps([]);
  };

  // Handle upload and move to mapping
  const handleUploadComplete = async () => {
    if (!fileToUpload || !state.file) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Upload file if not already uploaded
      if (!state.importJobId) {
        const result = await uploadFileWithProgress(fileToUpload, (progress) => {
          setUploadProgress(progress);
        });

        if (!result.success) {
          setError(result.error || 'Erreur lors du telechargement');
          setUploadProgress(null);
          setIsProcessing(false);
          return;
        }

        wizard.setImportJobId(result.importJobId!);
        setTimeout(() => setUploadProgress(null), 500);
      }

      goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du telechargement');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle save mapping
  const handleSaveMapping = async () => {
    if (!state.importJobId || !state.mapping) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/import/${state.importJobId}/mapping`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnMapping: state.mapping }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la sauvegarde du mapping');
      }

      goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle save options
  const handleSaveOptions = async () => {
    if (!state.importJobId) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/import/${state.importJobId}/options`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentConfig: state.assignment,
          duplicateConfig: state.duplicates,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la sauvegarde des options');
      }

      // Trigger validation/preview
      // For now, just move to preview step
      // In a full implementation, we'd validate rows here
      wizard.setValidationFromServer({
        totalRows: state.file?.rowCount || 0,
        validRows: state.file?.rowCount || 0,
        invalidRows: 0,
      });

      goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle start import
  const handleStartImport = async () => {
    if (!state.importJobId) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/import/${state.importJobId}/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors du demarrage de l\'import');
      }

      goNext(); // Move to progress step - SSE will take over
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du demarrage');
      setIsProcessing(false);
    }
  };

  // Handle cancel import
  const handleCancelImport = async () => {
    if (!state.importJobId) return;

    try {
      await fetch(`/api/import/${state.importJobId}/cancel`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Cancel error:', err);
    }
  };

  // Handle download error report
  const handleDownloadErrorReport = async () => {
    if (!state.importJobId) return;

    try {
      const response = await fetch(`/api/import/${state.importJobId}/error-report`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `erreurs_import_${state.importJobId.slice(0, 8)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download error:', err);
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
  };

  // Render step content
  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <UploadStep
            file={state.file}
            mapping={state.mapping}
            onFileSelect={handleFileSelect}
            onClear={handleClearFile}
            onUpdateMapping={wizard.updateColumnMapping}
            onResetMapping={wizard.resetMapping}
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
        return (
          <OptionsStep
            assignment={state.assignment}
            duplicateConfig={state.duplicates}
            salesUsers={salesUsers}
            onUpdateAssignment={wizard.updateAssignment}
            onUpdateDuplicates={wizard.updateDuplicates}
          />
        );

      case 'preview':
        return (
          <PreviewStep
            file={state.file!}
            summary={state.validationSummary}
            importJobId={state.importJobId}
            onDownloadErrorReport={handleDownloadErrorReport}
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
        if (!sseProgress) return null;
        return (
          <ResultsStep
            progress={sseProgress}
            fileName={state.file?.name || 'import.csv'}
            importJobId={state.importJobId || ''}
            onDownloadErrorReport={handleDownloadErrorReport}
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
      <button
        type="button"
        onClick={config.onClick}
        disabled={!canGoNext || isProcessing}
        className={`
          flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors
          ${canGoNext && !isProcessing
            ? currentStep === 'preview'
              ? 'bg-success text-white hover:bg-success/90'
              : 'bg-primary text-white hover:bg-primary/90'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
        `}
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
      </button>
    );
  };

  // Show loading state when resuming
  if (isLoadingResume) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <IconLoader2 className="w-12 h-12 text-primary animate-spin" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-ld">Chargement de l&apos;import...</h3>
          <p className="text-sm text-darklink mt-1">Veuillez patienter</p>
        </div>
      </div>
    );
  }

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
          <button
            onClick={reconnect}
            className="ml-auto text-primary hover:underline"
          >
            Reconnecter
          </button>
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
          <div>
            {canGoBack && (
              <button
                type="button"
                onClick={goPrevious}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-darklink hover:text-ld hover:bg-muted transition-colors"
              >
                <IconChevronLeft size={18} />
                Precedent
              </button>
            )}
          </div>

          <div>{renderActionButton()}</div>
        </div>
      )}

      {/* Cancel button during progress */}
      {currentStep === 'progress' && sseProgress?.status !== 'completed' && sseProgress?.status !== 'failed' && (
        <div className="flex justify-center pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleCancelImport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-error hover:bg-lighterror/30 transition-colors"
          >
            <IconX size={18} />
            Annuler l&apos;import
          </button>
        </div>
      )}
    </div>
  );
}
