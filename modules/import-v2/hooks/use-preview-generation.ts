/**
 * Preview Generation Hook
 *
 * Handles validation, duplicate detection, and preview data generation.
 * This is one of the most complex hooks - handles transition from upload to preview.
 * Extracted from import-wizard-v2.tsx for better maintainability.
 */

'use client';

import { useCallback, useState } from 'react';
import { useImportWizard } from '../context';
import { validateRows } from '../lib/validators/row-validator';
import { detectFileDuplicates } from '../lib/processors';
import { DEFAULT_ACTION_BY_TYPE } from '../config/constants';
import { analytics } from '@/lib/analytics';
import type { LeadFieldKey } from '../../import/types/mapping';
import type {
  DetailedPreviewDataV2,
  InvalidRowV2,
  FileDuplicateRowV2,
  DbDuplicateRowV2,
} from '../types/preview';

export function usePreviewGeneration() {
  const { state, dispatch, nextStep } = useImportWizard();

  // Warning state for DB duplicate check failures
  const [dbCheckWarning, setDbCheckWarning] = useState<string | null>(null);

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
      const fileDuplicateRowNumbers = new Set(fileDuplicateRows.map((r) => r.rowNumber));

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
            setDbCheckWarning(
              'La vérification des doublons en base a échoué. Les doublons existants ne seront pas détectés.'
            );
          }
        } catch {
          setDbCheckWarning(
            'La vérification des doublons en base a échoué. Les doublons existants ne seront pas détectés.'
          );
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
        payload: err instanceof Error ? err.message : "Erreur lors de la generation de l'apercu",
      });
      analytics.importV2Failed({
        error: err instanceof Error ? err.message : "Erreur lors de la generation de l'apercu",
        phase: 'preview',
        fileType: state.parsedFile?.type,
      });
    } finally {
      dispatch({ type: 'SET_CHECKING_DUPLICATES', payload: false });
    }
  }, [state.parsedFile, state.mapping, dispatch, nextStep]);

  return {
    handleUploadNext,
    dbCheckWarning,
  };
}
