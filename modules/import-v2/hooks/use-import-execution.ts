/**
 * Import Execution Hook
 *
 * Handles the actual import process with edit merging.
 * CRITICAL: Contains the fixed edit merging logic for all row types.
 * Extracted from import-wizard-v2.tsx for better maintainability.
 */

'use client';

import { useCallback } from 'react';
import { useImportWizard } from '../context';
import { validateRows } from '../lib/validators/row-validator';
import { detectFileDuplicates } from '../lib/processors';
import { startImportV2, uploadImportFileV2 } from '../lib/actions';
import { analytics } from '@/lib/analytics';

export function useImportExecution() {
  const { state, dispatch, nextStep } = useImportWizard();

  const handleStartImport = useCallback(async () => {
    if (!state.parsedFile || !state.mapping) return;

    dispatch({ type: 'SET_IMPORTING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    nextStep();

    try {
      // Step 1: Upload original file to storage (if available)
      let storagePath: string | undefined;
      let fileHash: string | undefined;

      if (state.originalFile) {
        const formData = new FormData();
        formData.append('file', state.originalFile);

        const uploadResult = await uploadImportFileV2(formData);
        if (uploadResult.success && uploadResult.data) {
          storagePath = uploadResult.data.storagePath;
          fileHash = uploadResult.data.fileHash;
        }
        // Note: We don't fail the import if upload fails - file download just won't be available
      }

      // Step 2: Re-validate rows to get normalized data for the server
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
      const dbDuplicateInfo =
        state.preview?.dbDuplicateRows.map((row) => ({
          rowNumber: row.rowNumber,
          matchedField: row.matchedField,
          matchedValue: row.matchedValue,
          existingLeadId: row.existingLead.id,
        })) || [];

      // Step 3: Call server action with unified row decisions + storage info
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
        storagePath,
        fileHash,
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
        dispatch({ type: 'SET_ERROR', payload: result.error || "Erreur lors de l'import" });
        analytics.importV2Failed({
          error: result.error || "Erreur lors de l'import",
          phase: 'import',
          fileType: state.parsedFile.type,
        });
      }
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : "Erreur lors de l'import",
      });
      analytics.importV2Failed({
        error: err instanceof Error ? err.message : "Erreur lors de l'import",
        phase: 'import',
        fileType: state.parsedFile?.type,
      });
    } finally {
      dispatch({ type: 'SET_IMPORTING', payload: false });
    }
  }, [
    state.originalFile,
    state.parsedFile,
    state.mapping,
    state.rowDecisions,
    state.editedRows,
    state.assignment,
    state.duplicates,
    state.defaultStatus,
    state.defaultSource,
    state.preview,
    dispatch,
    nextStep,
  ]);

  return {
    handleStartImport,
  };
}
