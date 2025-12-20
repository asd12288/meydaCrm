'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useImportWizard } from '../hooks/use-import-wizard';
import { WizardSteps } from '../ui/import-progress';
import { IMPORT_WIZARD_STEPS } from '../config/constants';
import { UploadStep } from './upload-step';
import { ReviewStep } from './review-step';
import {
  uploadImportFile,
  updateImportJobMapping,
  startImportParsing,
  startImportCommit,
  pollImportJobStatus,
  cancelImportJob,
} from '../lib/actions';
import {
  IconChevronLeft,
  IconChevronRight,
  IconUpload,
  IconAlertCircle,
  IconLoader2,
  IconX,
} from '@tabler/icons-react';
import type { SalesUser } from '@/modules/leads/types';

interface ImportWizardProps {
  salesUsers: SalesUser[];
  onImportComplete?: (importJobId: string) => void;
}

export function ImportWizard({ salesUsers, onImportComplete }: ImportWizardProps) {
  const wizard = useImportWizard();
  const [isProcessing, setIsProcessing] = useState(false);
  const [pollingJobId, setPollingJobId] = useState<string | null>(null);
  const [pollingPhase, setPollingPhase] = useState<'parsing' | 'importing' | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    state,
    isFirstStep,
    isLastStep,
    canGoNext,
    goNext,
    goPrevious,
    goToStep,
    fileToUpload, // Always CSV (converted from Excel if needed)
    wasConverted,
    conversionProgress,
  } = wizard;

  // Poll for job status (parsing or importing)
  const pollJobStatus = useCallback(async (jobId: string, phase: 'parsing' | 'importing') => {
    const result = await pollImportJobStatus(jobId);
    if (!result.success || !result.data) {
      wizard.setError(result.error || 'Erreur lors de la recuperation du statut');
      setPollingJobId(null);
      setPollingPhase(null);
      setIsProcessing(false);
      return;
    }

    const job = result.data;

    if (phase === 'parsing') {
      // Polling for parse completion
      if (job.status === 'ready') {
        // Parsing complete - update state with results
        wizard.setValidationFromServer({
          totalRows: job.totalRows,
          validRows: job.validRows,
          invalidRows: job.invalidRows,
        });
        wizard.setProgress(null);
        setPollingJobId(null);
        setPollingPhase(null);
        setIsProcessing(false);
        goNext(); // Move to review step
      } else if (job.status === 'failed') {
        wizard.setError(job.errorMessage || "Erreur lors de l'analyse du fichier");
        wizard.setProgress(null);
        setPollingJobId(null);
        setPollingPhase(null);
        setIsProcessing(false);
      } else if (job.status === 'parsing' || job.status === 'queued') {
        // Still parsing - update progress
        wizard.setProgress({
          phase: 'parsing',
          totalRows: job.totalRows,
          processedRows: job.importedRows || 0, // Use importedRows as rough progress during parse
          validRows: job.validRows,
          invalidRows: job.invalidRows,
          importedRows: 0,
          skippedRows: 0,
          currentChunk: 0,
          totalChunks: 0,
        });
      }
    } else {
      // Polling for import completion
      if (job.status === 'completed') {
        wizard.setProgress({
          phase: 'completed',
          totalRows: job.totalRows,
          processedRows: job.totalRows,
          validRows: job.validRows,
          invalidRows: job.invalidRows,
          importedRows: job.importedRows,
          skippedRows: job.skippedRows,
          currentChunk: 0,
          totalChunks: 0,
        });
        setPollingJobId(null);
        setPollingPhase(null);
        setIsProcessing(false);
        if (onImportComplete) {
          onImportComplete(jobId);
        }
      } else if (job.status === 'failed' || job.status === 'cancelled') {
        wizard.setProgress({
          phase: 'failed',
          totalRows: job.totalRows,
          processedRows: job.importedRows,
          validRows: job.validRows,
          invalidRows: job.invalidRows,
          importedRows: job.importedRows,
          skippedRows: job.skippedRows,
          currentChunk: 0,
          totalChunks: 0,
          errorMessage: job.errorMessage || "Erreur lors de l'import",
        });
        setPollingJobId(null);
        setPollingPhase(null);
        setIsProcessing(false);
      } else if (job.status === 'importing' || job.status === 'queued') {
        // Still importing - update progress
        wizard.setProgress({
          phase: 'importing',
          totalRows: job.totalRows,
          processedRows: job.importedRows,
          validRows: job.validRows,
          invalidRows: job.invalidRows,
          importedRows: job.importedRows,
          skippedRows: job.skippedRows,
          currentChunk: 0,
          totalChunks: 0,
        });
      }
    }
  }, [wizard, goNext, onImportComplete]);

  // Polling effect
  useEffect(() => {
    if (!pollingJobId || !pollingPhase) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Initial poll
    pollJobStatus(pollingJobId, pollingPhase);

    // Set up interval
    pollIntervalRef.current = setInterval(() => {
      pollJobStatus(pollingJobId, pollingPhase);
    }, 2000); // Poll every 2 seconds

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [pollingJobId, pollingPhase, pollJobStatus]);

  const handleFileSelect = async (file: File) => {
    await wizard.handleFileSelect(file);
  };

  const handleClearFile = () => {
    wizard.clearFile();
    setPollingJobId(null);
    setPollingPhase(null);
  };

  const handleCancelImport = async () => {
    if (!state.importJobId) return;

    const result = await cancelImportJob(state.importJobId);
    if (result.success) {
      wizard.setProgress({
        phase: 'failed',
        totalRows: state.validationSummary.total,
        processedRows: 0,
        validRows: state.validationSummary.valid,
        invalidRows: state.validationSummary.invalid,
        importedRows: 0,
        skippedRows: 0,
        currentChunk: 0,
        totalChunks: 0,
        errorMessage: 'Import annule',
      });
      setPollingJobId(null);
      setPollingPhase(null);
      setIsProcessing(false);
    }
  };

  const handleNext = async () => {
    // Step 0 -> Step 1: Upload file and start SERVER-SIDE parsing via QStash
    if (state.currentStep === 0 && fileToUpload) {
      setIsProcessing(true);
      wizard.setError(null);

      try {
        // Upload file if not already uploaded
        let jobId = state.importJobId;
        if (!jobId) {
          const formData = new FormData();
          formData.append('file', fileToUpload);

          const result = await uploadImportFile(formData);
          if (!result.success) {
            wizard.setError(result.error || 'Erreur lors du telechargement');
            setIsProcessing(false);
            return;
          }
          jobId = result.data!.importJobId;
          wizard.setImportJobId(jobId);
        }

        // Save mapping config
        if (state.mapping) {
          const mappingResult = await updateImportJobMapping(jobId, state.mapping);
          if (!mappingResult.success) {
            wizard.setError(mappingResult.error || 'Erreur lors de la sauvegarde du mapping');
            setIsProcessing(false);
            return;
          }
        }

        // =====================================================================
        // SERVER-SIDE PARSING via QStash
        // =====================================================================

        // Start parsing via QStash worker
        const parseResult = await startImportParsing(jobId);
        if (!parseResult.success) {
          wizard.setError(parseResult.error || "Erreur lors du demarrage de l'analyse");
          setIsProcessing(false);
          return;
        }

        // Show initial parsing progress
        wizard.setProgress({
          phase: 'parsing',
          totalRows: 0,
          processedRows: 0,
          validRows: 0,
          invalidRows: 0,
          importedRows: 0,
          skippedRows: 0,
          currentChunk: 0,
          totalChunks: 0,
        });

        // Start polling for parse completion
        setPollingJobId(jobId);
        setPollingPhase('parsing');

        // Note: The polling effect will handle moving to the next step
        // when parsing is complete
        return;
      } catch (error) {
        console.error('Server-side parsing error:', error);
        wizard.setError(error instanceof Error ? error.message : 'Erreur lors du traitement');
        setIsProcessing(false);
        return;
      }
    }

    goNext();
  };

  const handleStartImport = async () => {
    if (!state.importJobId) {
      wizard.setError('Configuration incomplete');
      return;
    }

    setIsProcessing(true);
    wizard.setError(null);

    try {
      // Go to import step to show progress
      goNext();

      // Update progress to show we're starting
      wizard.setProgress({
        phase: 'importing',
        totalRows: state.validationSummary.total,
        processedRows: 0,
        validRows: state.validationSummary.valid,
        invalidRows: state.validationSummary.invalid,
        importedRows: 0,
        skippedRows: 0,
        currentChunk: 0,
        totalChunks: 0,
      });

      // Start the import commit via QStash
      const result = await startImportCommit(state.importJobId, {
        assignment: state.assignment,
        duplicates: state.duplicates,
        defaultStatus: 'new',
        defaultSource: state.file?.name,
      });

      if (!result.success) {
        throw new Error(result.error || "Erreur lors de l'import");
      }

      // Start polling for import completion
      setPollingJobId(state.importJobId);
      setPollingPhase('importing');
    } catch (error) {
      wizard.setProgress({
        phase: 'failed',
        totalRows: state.validationSummary.total,
        processedRows: 0,
        validRows: state.validationSummary.valid,
        invalidRows: state.validationSummary.invalid,
        importedRows: 0,
        skippedRows: 0,
        currentChunk: 0,
        totalChunks: 0,
        errorMessage: error instanceof Error ? error.message : 'Erreur inconnue',
      });
      setIsProcessing(false);
    }
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 0: // File (upload + mapping)
        return (
          <UploadStep
            file={state.file}
            mapping={state.mapping}
            onFileSelect={handleFileSelect}
            onClear={handleClearFile}
            onUpdateMapping={wizard.updateColumnMapping}
            onResetMapping={wizard.resetMapping}
            error={state.error}
          />
        );
      case 1: // Review (validation + assignment)
      case 2: // Import (shows progress in ReviewStep)
        return (
          <ReviewStep
            file={state.file}
            validatedRows={state.validatedRows}
            summary={state.validationSummary}
            assignment={state.assignment}
            duplicateConfig={state.duplicates}
            onUpdateAssignment={wizard.updateAssignment}
            onUpdateDuplicates={wizard.updateDuplicates}
            salesUsers={salesUsers}
            progress={state.progress}
            importJobId={state.importJobId}
          />
        );
      default:
        return null;
    }
  };

  // Determine button states
  const showPrevious = !isFirstStep && state.currentStep !== 2;
  const showNext = state.currentStep === 0;
  const showImport = state.currentStep === 1 && !state.progress;
  const isImportInProgress = state.progress && state.progress.phase !== 'completed' && state.progress.phase !== 'failed';

  return (
    <div className="space-y-6">
      {/* Steps indicator */}
      <WizardSteps
        steps={IMPORT_WIZARD_STEPS.map((s) => ({ id: s.id, label: s.label }))}
        currentStep={state.currentStep}
        onStepClick={(index) => {
          if (index < state.currentStep && !state.progress) {
            goToStep(index);
          }
        }}
      />

      {/* Error display */}
      {state.error && !state.progress && (
        <div className="flex items-start gap-3 p-4 bg-lighterror/30 border border-error/30 rounded-lg">
          <IconAlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-error">Erreur</p>
            <p className="text-sm text-error/80">{state.error}</p>
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="min-h-[350px]">{renderStep()}</div>

      {/* Cancel button during import */}
      {isImportInProgress && (
        <div className="flex justify-center pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleCancelImport}
            className="flex items-center gap-2 px-4 py-2 rounded-md font-medium text-error hover:bg-lighterror/30 transition-colors"
          >
            <IconX className="w-4 h-4" />
            Annuler l&apos;import
          </button>
        </div>
      )}

      {/* Navigation buttons */}
      {!isImportInProgress && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            {showPrevious && (
              <button
                type="button"
                onClick={goPrevious}
                className="flex items-center gap-2 px-4 py-2 rounded-md font-medium text-darklink hover:text-ld hover:bg-muted transition-colors"
              >
                <IconChevronLeft className="w-4 h-4" />
                Precedent
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {showNext && (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext || isProcessing}
                className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium transition-colors ${
                  canGoNext && !isProcessing
                    ? 'bg-primary text-white hover:bg-primaryemphasis'
                    : 'bg-primary/50 text-white/70 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <>
                    <IconLoader2 className="w-4 h-4 animate-spin" />
                    Analyse...
                  </>
                ) : (
                  <>
                    Suivant
                    <IconChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            {showImport && (
              <button
                type="button"
                onClick={handleStartImport}
                disabled={!canGoNext || isProcessing}
                className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium transition-colors ${
                  canGoNext && !isProcessing
                    ? 'bg-success text-white hover:bg-successemphasis'
                    : 'bg-success/50 text-white/70 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <>
                    <IconLoader2 className="w-4 h-4 animate-spin" />
                    Preparation...
                  </>
                ) : (
                  <>
                    <IconUpload className="w-4 h-4" />
                    Importer
                  </>
                )}
              </button>
            )}

            {/* Show action buttons after import complete/failed */}
            {state.progress?.phase === 'completed' && (
              <div className="flex items-center gap-3">
                <a
                  href="/leads"
                  className="px-6 py-2 rounded-md font-medium bg-primary text-white hover:bg-primaryemphasis transition-colors"
                >
                  Voir les leads
                </a>
                <button
                  type="button"
                  onClick={() => wizard.reset()}
                  className="px-4 py-2 rounded-md font-medium text-darklink hover:text-ld hover:bg-muted transition-colors"
                >
                  Nouvel import
                </button>
              </div>
            )}

            {state.progress?.phase === 'failed' && (
              <button
                type="button"
                onClick={() => wizard.reset()}
                className="px-6 py-2 rounded-md font-medium bg-primary text-white hover:bg-primaryemphasis transition-colors"
              >
                Reessayer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
