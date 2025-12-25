'use client';

import { useState, useCallback, useMemo } from 'react';
import type {
  ImportWizardState,
  UploadedFile,
  ColumnMappingConfig,
  ValidatedRow,
  AssignmentConfig,
  DuplicateConfig,
  ImportProgress,
  LeadFieldKey,
} from '../types';
import { IMPORT_WIZARD_STEPS } from '../config/constants';
import { autoMapColumns } from '../lib/auto-mapper';
import { validateRows, findDuplicatesInFile } from '../lib/validators';
import {
  parseCSVContent,
  applyColumnMapping,
  readFileAsText,
  convertExcelToCSV,
} from '../lib/parsers';
import { DISPLAY_LIMITS } from '@/lib/constants';

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: ImportWizardState = {
  currentStep: 0,
  file: null,
  mapping: null,
  validatedRows: [],
  validationSummary: {
    total: 0,
    valid: 0,
    invalid: 0,
    duplicates: 0,
  },
  assignment: {
    mode: 'none',
  },
  duplicates: {
    strategy: 'skip',
    checkFields: ['email', 'external_id'],
    checkDatabase: true,
    checkWithinFile: true,
  },
  importJobId: null,
  progress: null,
  error: null,
};

// Extended state for internal use
interface ExtendedState extends ImportWizardState {
  // Original file reference (for display purposes)
  originalFile: File | null;
  // File to upload (CSV - either original or converted from Excel)
  fileToUpload: File | null;
  // Whether the file was converted from Excel
  wasConverted: boolean;
  // Conversion progress (0-100)
  conversionProgress: number;
  // Available sheets for Excel files (not currently used - always use first sheet)
  availableSheets: string[];
  // Selected sheet index for Excel files
  selectedSheetIndex: number;
}

const extendedInitialState: ExtendedState = {
  ...initialState,
  originalFile: null,
  fileToUpload: null,
  wasConverted: false,
  conversionProgress: 0,
  availableSheets: [],
  selectedSheetIndex: 0,
};

// =============================================================================
// HOOK
// =============================================================================

export function useImportWizard() {
  const [state, setState] = useState<ExtendedState>(extendedInitialState);

  // Current step info
  const currentStepInfo = IMPORT_WIZARD_STEPS[state.currentStep];
  const isFirstStep = state.currentStep === 0;
  const isLastStep = state.currentStep === IMPORT_WIZARD_STEPS.length - 1;

  // Can navigate? (3-step flow)
  const canGoNext = useMemo(() => {
    switch (state.currentStep) {
      case 0: // File (upload + mapping)
        if (!state.file) return false;
        // Excel files can proceed without mapping (parsed server-side)
        if (state.file.type !== 'csv') return true;
        // CSV files need mapping with at least one field mapped
        return state.mapping !== null && state.mapping.mappings.some((m) => m.targetField);
      case 1: // Review (validation + assignment)
        return state.validationSummary.valid > 0;
      case 2: // Import (final step)
        return true;
      default:
        return false;
    }
  }, [state.currentStep, state.file, state.mapping, state.validationSummary]);

  const canGoPrevious = state.currentStep > 0;

  // =============================================================================
  // NAVIGATION
  // =============================================================================

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < IMPORT_WIZARD_STEPS.length) {
      setState((prev) => ({ ...prev, currentStep: step, error: null }));
    }
  }, []);

  const goNext = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep < IMPORT_WIZARD_STEPS.length - 1) {
        return { ...prev, currentStep: prev.currentStep + 1, error: null };
      }
      return prev;
    });
  }, []);

  const goPrevious = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep > 0) {
        return { ...prev, currentStep: prev.currentStep - 1, error: null };
      }
      return prev;
    });
  }, []);

  // =============================================================================
  // FILE HANDLING
  // =============================================================================

  const handleFileSelect = useCallback(async (file: File) => {
    setState((prev) => ({ ...prev, error: null, conversionProgress: 0 }));

    try {
      // Determine file type
      const ext = file.name.toLowerCase().split('.').pop() as 'csv' | 'xlsx' | 'xls';

      if (ext === 'csv') {
        // Parse CSV client-side (preview only, full parsing done server-side)
        const { content, encoding } = await readFileAsText(file);
        const { headers, rows, delimiter } = parseCSVContent(content, {
          hasHeader: true,
          maxRows: 100, // Preview only
        });

        // Count total rows
        const totalLines = content.split('\n').filter((l) => l.trim() !== '').length;
        const rowCount = Math.max(0, totalLines - 1);

        // Auto-map columns
        const sampleData = rows.slice(0, DISPLAY_LIMITS.SAMPLE_ROWS_PREVIEW).map((r) => r.values);
        const mappings = autoMapColumns(headers, sampleData);

        const uploadedFile: UploadedFile = {
          name: file.name,
          size: file.size,
          type: 'csv',
          storagePath: '', // Will be set after upload
          rowCount,
          headers,
          sampleData: rows,
        };

        const mappingConfig: ColumnMappingConfig = {
          mappings,
          hasHeaderRow: true,
          headerRowIndex: 0,
          encoding,
          delimiter,
        };

        setState((prev) => ({
          ...prev,
          file: uploadedFile,
          mapping: mappingConfig,
          originalFile: file,
          fileToUpload: file, // CSV files upload as-is
          wasConverted: false,
          conversionProgress: 100,
          availableSheets: [],
          selectedSheetIndex: 0,
        }));
      } else {
        // For Excel files: Convert to CSV client-side using SheetJS
        // This avoids Deno Edge Function compatibility issues with XLSX library
        setState((prev) => ({ ...prev, conversionProgress: 10 }));

        // Convert Excel file to CSV

        // Convert Excel to CSV
        const { csvFile, headers, rowCount, originalName } = await convertExcelToCSV(file);

        setState((prev) => ({ ...prev, conversionProgress: 80 }));

        // Parse the CSV for preview
        const csvContent = await csvFile.text();
        const { rows, delimiter } = parseCSVContent(csvContent, {
          hasHeader: true,
          maxRows: 100, // Preview only
        });

        // Auto-map columns
        const sampleData = rows.slice(0, DISPLAY_LIMITS.SAMPLE_ROWS_PREVIEW).map((r) => r.values);
        const mappings = autoMapColumns(headers, sampleData);

        const uploadedFile: UploadedFile = {
          name: originalName, // Show original Excel filename to user
          size: file.size,
          type: 'csv', // Always CSV after conversion
          storagePath: '',
          rowCount,
          headers,
          sampleData: rows,
        };

        const mappingConfig: ColumnMappingConfig = {
          mappings,
          hasHeaderRow: true,
          headerRowIndex: 0,
          encoding: 'UTF-8',
          delimiter,
        };

        setState((prev) => ({
          ...prev,
          file: uploadedFile,
          mapping: mappingConfig,
          originalFile: file, // Keep original for reference
          fileToUpload: csvFile, // Upload the converted CSV
          wasConverted: true,
          conversionProgress: 100,
          availableSheets: [],
          selectedSheetIndex: 0,
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erreur lors de l\'analyse du fichier',
        conversionProgress: 0,
      }));
    }
  }, []);

  const clearFile = useCallback(() => {
    setState((prev) => ({
      ...prev,
      file: null,
      mapping: null,
      validatedRows: [],
      validationSummary: { total: 0, valid: 0, invalid: 0, duplicates: 0 },
      originalFile: null,
      fileToUpload: null,
      wasConverted: false,
      conversionProgress: 0,
      availableSheets: [],
      selectedSheetIndex: 0,
    }));
  }, []);

  /**
   * Set file data from server parsing (for Excel files)
   * Called after Edge Function parses the file
   */
  const setFileDataFromServer = useCallback(
    (data: {
      headers: string[];
      sampleData: Array<{ rowNumber: number; values: string[]; rawLine: string }>;
      rowCount: number;
      availableSheets?: string[];
      sheetName?: string;
    }) => {
      setState((prev) => {
        if (!prev.file) return prev;

        // Auto-map columns based on headers
        const sampleValues = data.sampleData.slice(0, DISPLAY_LIMITS.SAMPLE_ROWS_PREVIEW).map((r) => r.values);
        const mappings = autoMapColumns(data.headers, sampleValues);

        return {
          ...prev,
          file: {
            ...prev.file,
            headers: data.headers,
            sampleData: data.sampleData,
            rowCount: data.rowCount,
          },
          mapping: {
            mappings,
            hasHeaderRow: true,
            headerRowIndex: 0,
            encoding: 'UTF-8',
            delimiter: ',',
            sheetName: data.sheetName,
          },
          availableSheets: data.availableSheets || [],
        };
      });
    },
    []
  );

  /**
   * Select a different sheet (for Excel files with multiple sheets)
   */
  const selectSheet = useCallback((sheetIndex: number) => {
    setState((prev) => ({
      ...prev,
      selectedSheetIndex: sheetIndex,
      // Clear mapping - will be repopulated after re-parsing
      mapping: null,
      file: prev.file
        ? { ...prev.file, headers: [], sampleData: [], rowCount: 0 }
        : null,
    }));
  }, []);

  // =============================================================================
  // COLUMN MAPPING
  // =============================================================================

  const updateColumnMapping = useCallback(
    (sourceIndex: number, targetField: LeadFieldKey | null) => {
      setState((prev) => {
        if (!prev.mapping) return prev;

        const newMappings = prev.mapping.mappings.map((m) => {
          if (m.sourceIndex === sourceIndex) {
            return { ...m, targetField, isManual: true, confidence: targetField ? 1 : 0 };
          }
          // If this field was previously mapped elsewhere, clear it
          if (targetField && m.targetField === targetField && m.sourceIndex !== sourceIndex) {
            return { ...m, targetField: null, confidence: 0 };
          }
          return m;
        });

        return {
          ...prev,
          mapping: { ...prev.mapping, mappings: newMappings },
        };
      });
    },
    []
  );

  const resetMapping = useCallback(() => {
    setState((prev) => {
      if (!prev.file || !prev.mapping) return prev;

      const sampleData = prev.file.sampleData.slice(0, 5).map((r) => r.values);
      const newMappings = autoMapColumns(prev.file.headers, sampleData);

      return {
        ...prev,
        mapping: { ...prev.mapping, mappings: newMappings },
      };
    });
  }, []);

  // =============================================================================
  // VALIDATION
  // =============================================================================

  const runValidation = useCallback(async () => {
    if (!state.file || !state.mapping) return;

    setState((prev) => ({ ...prev, error: null }));

    try {
      // Apply mapping to all sample rows
      const mappedRows = applyColumnMapping(state.file.sampleData, state.mapping.mappings);

      // Validate rows
      const { results, summary } = validateRows(mappedRows);

      // Find duplicates within file
      const duplicates = findDuplicatesInFile(
        results,
        state.duplicates.checkFields
      );

      // Update results with duplicate info
      const resultsWithDuplicates: ValidatedRow[] = results.map((row) => {
        const dup = duplicates.get(row.rowNumber);
        return {
          rowNumber: row.rowNumber,
          data: row.normalizedData,
          unmapped: {},
          isValid: row.isValid && !dup,
          errors: Object.fromEntries(row.errors.map((e) => [e.field, e.message])),
          warnings: Object.fromEntries(row.warnings.map((e) => [e.field, e.message])),
          duplicateOf: dup
            ? {
                type: 'file' as const,
                matchedValue: dup.value,
                matchedField: dup.field,
              }
            : undefined,
        };
      });

      setState((prev) => ({
        ...prev,
        validatedRows: resultsWithDuplicates,
        validationSummary: {
          total: summary.totalRows,
          valid: summary.validRows - duplicates.size,
          invalid: summary.invalidRows,
          duplicates: duplicates.size,
        },
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erreur lors de la validation',
      }));
    }
  }, [state.file, state.mapping, state.duplicates.checkFields]);

  // =============================================================================
  // ASSIGNMENT
  // =============================================================================

  const updateAssignment = useCallback((assignment: Partial<AssignmentConfig>) => {
    setState((prev) => ({
      ...prev,
      assignment: { ...prev.assignment, ...assignment },
    }));
  }, []);

  // =============================================================================
  // DUPLICATES
  // =============================================================================

  const updateDuplicates = useCallback((duplicates: Partial<DuplicateConfig>) => {
    setState((prev) => ({
      ...prev,
      duplicates: { ...prev.duplicates, ...duplicates },
    }));
  }, []);

  // =============================================================================
  // IMPORT EXECUTION
  // =============================================================================

  const setProgress = useCallback((progress: ImportProgress | null) => {
    setState((prev) => ({ ...prev, progress }));
  }, []);

  const setImportJobId = useCallback((id: string) => {
    setState((prev) => ({ ...prev, importJobId: id }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  /**
   * Set validation results from server (for Excel files parsed server-side)
   */
  const setValidationFromServer = useCallback(
    (results: { totalRows: number; validRows: number; invalidRows: number }) => {
      setState((prev) => ({
        ...prev,
        validationSummary: {
          total: results.totalRows,
          valid: results.validRows,
          invalid: results.invalidRows,
          duplicates: 0,
        },
        // Update file rowCount if it was unknown (Excel files)
        file: prev.file
          ? { ...prev.file, rowCount: results.totalRows }
          : prev.file,
      }));
    },
    []
  );

  // =============================================================================
  // RESET
  // =============================================================================

  const reset = useCallback(() => {
    setState(extendedInitialState);
  }, []);

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // State
    state,
    currentStepInfo,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrevious,

    // Navigation
    goToStep,
    goNext,
    goPrevious,

    // File handling
    handleFileSelect,
    clearFile,
    originalFile: state.originalFile, // Original file (for display)
    fileToUpload: state.fileToUpload, // File to upload (always CSV - converted if needed)
    wasConverted: state.wasConverted, // Whether Excel was converted to CSV
    conversionProgress: state.conversionProgress, // Conversion progress (0-100)
    setFileDataFromServer, // Called after Edge Function parses CSV
    availableSheets: state.availableSheets,
    selectedSheetIndex: state.selectedSheetIndex,
    selectSheet,

    // Mapping
    updateColumnMapping,
    resetMapping,

    // Validation
    runValidation,

    // Assignment
    updateAssignment,

    // Duplicates
    updateDuplicates,

    // Import
    setProgress,
    setImportJobId,
    setError,
    setValidationFromServer,

    // Reset
    reset,
  };
}

export type UseImportWizardReturn = ReturnType<typeof useImportWizard>;
