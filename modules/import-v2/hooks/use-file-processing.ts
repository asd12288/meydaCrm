/**
 * File Processing Hook
 *
 * Handles file selection, parsing, and column mapping changes.
 * Extracted from import-wizard-v2.tsx for better maintainability.
 */

'use client';

import { useCallback } from 'react';
import { useImportWizard } from '../context';
import { useClientParser } from './use-client-parser';
import { analytics } from '@/lib/analytics';
import type { LeadFieldKey } from '../../import/types/mapping';

export function useFileProcessing() {
  const { dispatch } = useImportWizard();
  const { parse, isParsing, error: parseError } = useClientParser();

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
        dispatch({
          type: 'SET_ERROR',
          payload: err instanceof Error ? err.message : 'Erreur de parsing',
        });
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

  return {
    handleFileSelect,
    handleFileClear,
    handleMappingChange,
    isParsing,
    parseError,
  };
}
