'use client';

import { useState, useEffect, useCallback } from 'react';
import { useImportWizard } from '../hooks/use-import-wizard';
import { WizardSteps } from '../ui/import-progress';
import { IMPORT_WIZARD_STEPS, CLIENT_BATCH_SIZE } from '../config/constants';
import { UploadStep } from './upload-step';
import { ReviewStep } from './review-step';
import {
  uploadImportFile,
  updateImportJobMapping,
  startImportCommit,
  getImportJob,
  insertImportRowsBatch,
  markImportJobReady,
} from '../lib/actions';
import { parseCSVContent, applyColumnMapping } from '../lib/parsers';
import { validateRow, normalizeRowData } from '../lib/validators';
import {
  IconChevronLeft,
  IconChevronRight,
  IconUpload,
  IconAlertCircle,
  IconLoader2,
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

  // Poll for job status when parsing Excel files server-side
  const pollJobStatus = useCallback(async (jobId: string) => {
    const result = await getImportJob(jobId);
    if (!result.success || !result.data) {
      wizard.setError(result.error || 'Erreur lors de la recuperation du statut');
      setPollingJobId(null);
      setIsProcessing(false);
      return;
    }

    const job = result.data;

    // Check status
    if (job.status === 'ready') {
      // Parsing complete - update state with results
      wizard.setValidationFromServer({
        totalRows: job.total_rows || 0,
        validRows: job.valid_rows || 0,
        invalidRows: job.invalid_rows || 0,
      });
      setPollingJobId(null);
      setIsProcessing(false);
      goNext(); // Move to review step
    } else if (job.status === 'failed') {
      wizard.setError(job.error_message || 'Erreur lors de l\'analyse du fichier');
      setPollingJobId(null);
      setIsProcessing(false);
    } else if (job.status === 'parsing') {
      // Still parsing - update progress
      wizard.setProgress({
        phase: 'parsing',
        totalRows: job.total_rows || 0,
        processedRows: (job.current_chunk || 0) * 1000, // Approximate
        validRows: job.valid_rows || 0,
        invalidRows: job.invalid_rows || 0,
        importedRows: 0,
        skippedRows: 0,
        currentChunk: job.current_chunk || 0,
        totalChunks: job.total_chunks || 0,
      });
    }
  }, [wizard, goNext]);

  // Polling effect
  useEffect(() => {
    if (!pollingJobId) return;

    const interval = setInterval(() => {
      pollJobStatus(pollingJobId);
    }, 1500); // Poll every 1.5 seconds

    return () => clearInterval(interval);
  }, [pollingJobId, pollJobStatus]);

  const handleFileSelect = async (file: File) => {
    await wizard.handleFileSelect(file);
  };

  const handleClearFile = () => {
    wizard.clearFile();
    setPollingJobId(null);
  };

  const handleNext = async () => {
    // Step 0 -> Step 1: Upload file and start CLIENT-SIDE parsing
    // fileToUpload is always CSV (converted from Excel if needed)
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
        // CLIENT-SIDE PARSING (bypasses Edge Function to avoid memory limits)
        // =====================================================================

        // Read the entire file content
        const fileContent = await fileToUpload.text();

        // Parse ALL rows (not just preview)
        const { headers, rows: allRawRows } = parseCSVContent(fileContent, {
          hasHeader: true,
          // No maxRows limit - parse everything
        });

        const totalRows = allRawRows.length;
        console.log(`Client-side parsing: ${totalRows} rows, ${headers.length} columns`);

        // Apply column mapping to get normalized data
        const mappedRows = applyColumnMapping(allRawRows, state.mapping!.mappings);

        // Validate and prepare rows for batch insert
        let validCount = 0;
        let invalidCount = 0;
        const totalChunks = Math.ceil(totalRows / CLIENT_BATCH_SIZE);

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const startIdx = chunkIndex * CLIENT_BATCH_SIZE;
          const endIdx = Math.min(startIdx + CLIENT_BATCH_SIZE, totalRows);
          const chunkRows = mappedRows.slice(startIdx, endIdx);

          // Validate and normalize each row in the chunk
          const batchRows = chunkRows.map((row) => {
            const normalized = normalizeRowData(row.data);
            const validation = validateRow(row.rowNumber, row.data);

            if (validation.isValid) {
              validCount++;
            } else {
              invalidCount++;
            }

            return {
              row_number: row.rowNumber,
              raw_data: Object.fromEntries(
                state.mapping!.mappings.map((m, idx) => [
                  m.sourceColumn,
                  allRawRows[row.rowNumber - 2]?.values[idx] || '',
                ])
              ),
              normalized_data: normalized as Record<string, string | null>,
              validation_errors: validation.isValid
                ? null
                : Object.fromEntries(validation.errors.map((e) => [e.field, e.message])),
              status: validation.isValid ? 'valid' as const : 'invalid' as const,
            };
          });

          // Send batch to server
          const batchResult = await insertImportRowsBatch(jobId, batchRows, {
            currentChunk: chunkIndex,
            totalChunks,
            totalRows,
            validRows: validCount,
            invalidRows: invalidCount,
          });

          if (!batchResult.success) {
            wizard.setError(batchResult.error || 'Erreur lors de l\'envoi des donnees');
            setIsProcessing(false);
            return;
          }

          // Update progress
          wizard.setProgress({
            phase: 'parsing',
            totalRows,
            processedRows: endIdx,
            validRows: validCount,
            invalidRows: invalidCount,
            importedRows: 0,
            skippedRows: 0,
            currentChunk: chunkIndex + 1,
            totalChunks,
          });

          console.log(`Chunk ${chunkIndex + 1}/${totalChunks}: ${validCount} valid, ${invalidCount} invalid`);
        }

        // Mark job as ready
        const readyResult = await markImportJobReady(jobId, {
          totalRows,
          validRows: validCount,
          invalidRows: invalidCount,
        });

        if (!readyResult.success) {
          wizard.setError(readyResult.error || 'Erreur lors de la finalisation');
          setIsProcessing(false);
          return;
        }

        // Update validation summary from actual parsed data
        wizard.setValidationFromServer({
          totalRows,
          validRows: validCount,
          invalidRows: invalidCount,
        });

        // NOTE: Don't call runValidation() here - it only validates 100 preview rows
        // and would overwrite the correct counts from setValidationFromServer()

        // Clear progress and move to review step
        wizard.setProgress(null);
        setIsProcessing(false);
        goNext();
        return;
      } catch (error) {
        console.error('Client-side parsing error:', error);
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

      // Start the import commit via Edge Function
      // The Edge Function now handles all the batch processing
      const result = await startImportCommit(state.importJobId, {
        assignment: state.assignment,
        duplicates: state.duplicates,
        defaultStatus: 'new',
        defaultSource: state.file?.name,
      });

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'import');
      }

      // Poll for completion
      const pollForCompletion = async () => {
        const jobResult = await getImportJob(state.importJobId!);
        if (!jobResult.success || !jobResult.data) {
          throw new Error(jobResult.error || 'Erreur lors de la recuperation du statut');
        }

        const job = jobResult.data;

        if (job.status === 'completed') {
          wizard.setProgress({
            phase: 'completed',
            totalRows: job.total_rows || 0,
            processedRows: job.total_rows || 0,
            validRows: job.valid_rows || 0,
            invalidRows: job.invalid_rows || 0,
            importedRows: job.imported_rows || 0,
            skippedRows: job.skipped_rows || 0,
            currentChunk: 0,
            totalChunks: 0,
          });

          if (onImportComplete) {
            onImportComplete(state.importJobId!);
          }
          setIsProcessing(false);
          return true;
        } else if (job.status === 'failed') {
          throw new Error(job.error_message || 'Erreur lors de l\'import');
        } else if (job.status === 'importing') {
          // Update progress
          wizard.setProgress({
            phase: 'importing',
            totalRows: job.total_rows || 0,
            processedRows: job.imported_rows || 0,
            validRows: job.valid_rows || 0,
            invalidRows: job.invalid_rows || 0,
            importedRows: job.imported_rows || 0,
            skippedRows: job.skipped_rows || 0,
            currentChunk: job.current_chunk || 0,
            totalChunks: job.total_chunks || 0,
          });
          return false;
        }
        return false;
      };

      // Start polling
      const pollInterval = setInterval(async () => {
        try {
          const done = await pollForCompletion();
          if (done) {
            clearInterval(pollInterval);
          }
        } catch (error) {
          clearInterval(pollInterval);
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
      }, 2000); // Poll every 2 seconds

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
