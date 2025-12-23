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
  cancelImportJob,
} from '../lib/actions';

// Types
import type { SalesUser } from '@/modules/leads/types';
import type { ImportWizardStep } from '../config/constants';

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
  const wizard = useImportWizard();

  // Local state
  const [currentStep, setCurrentStep] = useState<ImportWizardStep>('upload');
  const [completedSteps, setCompletedSteps] = useState<ImportWizardStep[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        if (state.assignment.mode === 'round_robin') {
          if (!state.assignment.roundRobinUserIds || state.assignment.roundRobinUserIds.length < 2) return false;
        }
        if (state.assignment.mode === 'by_column' && !state.assignment.assignmentColumn) return false;
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
      const result = await updateImportJobMapping(state.importJobId, state.mapping);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la sauvegarde du mapping');
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
      const result = await updateImportJobOptions(state.importJobId, {
        assignmentConfig: state.assignment,
        duplicateConfig: state.duplicates,
      });

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la sauvegarde des options');
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
      const result = await startImportParsing(state.importJobId);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors du demarrage de l\'import');
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
      await cancelImportJob(state.importJobId);
    } catch (err) {
      console.error('Cancel error:', err);
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
            summary={state.validationSummary}
            importJobId={state.importJobId}
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
          <div>
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
