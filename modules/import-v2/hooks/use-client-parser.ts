/**
 * Client Parser Hook for Import V2
 *
 * React hook for file parsing with progress tracking and auto-mapping.
 * Handles CSV and XLSX files entirely client-side.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import type {
  ParsedFileV2,
  ColumnMappingV2,
  ColumnMappingConfigV2,
} from '../types';
import type { LeadFieldKey } from '../../import/types/mapping';
import {
  parseFile,
  validateFile,
  detectFileType,
  detectDelimiter,
  type ParseProgressCallback,
} from '../lib/parsers';
import { findBestMatch } from '../../import/config/column-aliases';
import { FILE_CONSTRAINTS } from '../config/constants';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Parsing progress state
 */
export interface ParsingProgress {
  /** Rows parsed so far */
  parsedRows: number;
  /** Total rows (may be estimated) */
  totalRows: number;
  /** Current phase */
  phase: 'idle' | 'reading' | 'parsing' | 'mapping' | 'complete';
  /** Progress percentage (0-100) */
  percentage: number;
}

/**
 * Parse result from the hook
 */
export interface ClientParseResult {
  /** Parsed file data */
  file: ParsedFileV2;
  /** Auto-generated column mapping */
  mapping: ColumnMappingConfigV2;
  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Hook return type
 */
export interface UseClientParserReturn {
  /** Current parsing progress */
  progress: ParsingProgress;
  /** Whether currently parsing */
  isParsing: boolean;
  /** Error message if parsing failed */
  error: string | null;
  /** Last successful parse result */
  result: ClientParseResult | null;
  /** Parse a file */
  parse: (file: File, options?: ClientParseOptions) => Promise<ClientParseResult | null>;
  /** Validate a file without parsing */
  validate: (file: File) => { valid: boolean; error?: string };
  /** Reset state */
  reset: () => void;
}

/**
 * Options for client parsing
 */
export interface ClientParseOptions {
  /** Maximum rows to parse (0 = all) */
  maxRows?: number;
  /** Sheet name to parse (for Excel files) */
  sheetName?: string;
  /** Whether file has header row (default: true) */
  hasHeaderRow?: boolean;
  /** Minimum confidence for auto-mapping (default: 0.7) */
  minMappingConfidence?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const INITIAL_PROGRESS: ParsingProgress = {
  parsedRows: 0,
  totalRows: 0,
  phase: 'idle',
  percentage: 0,
};

const DEFAULT_OPTIONS: Required<ClientParseOptions> = {
  maxRows: 0,
  sheetName: '',
  hasHeaderRow: true,
  minMappingConfidence: 0.7,
};

// =============================================================================
// AUTO-MAPPING LOGIC
// =============================================================================

/**
 * Create column mappings with auto-detection
 */
function createAutoMappings(
  headers: string[],
  sampleRows: string[][],
  minConfidence: number
): ColumnMappingV2[] {
  const usedFields = new Set<LeadFieldKey>();
  const mappings: ColumnMappingV2[] = [];

  // First pass: find high-confidence matches
  const candidates: Array<{
    index: number;
    header: string;
    field: LeadFieldKey | null;
    confidence: number;
  }> = [];

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const { field, confidence } = findBestMatch(header);
    candidates.push({ index: i, header, field, confidence });
  }

  // Sort by confidence (highest first) to assign best matches first
  const sortedCandidates = [...candidates].sort((a, b) => b.confidence - a.confidence);

  // Assign fields, avoiding duplicates
  const fieldAssignments = new Map<number, { field: LeadFieldKey | null; confidence: number }>();

  for (const candidate of sortedCandidates) {
    if (
      candidate.field &&
      candidate.confidence >= minConfidence &&
      !usedFields.has(candidate.field)
    ) {
      usedFields.add(candidate.field);
      fieldAssignments.set(candidate.index, {
        field: candidate.field,
        confidence: candidate.confidence,
      });
    } else {
      // No mapping or below threshold
      fieldAssignments.set(candidate.index, {
        field: null,
        confidence: candidate.confidence,
      });
    }
  }

  // Build mappings in original column order
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const assignment = fieldAssignments.get(i) || { field: null, confidence: 0 };

    // Get sample values (up to 5)
    const sampleValues: string[] = [];
    for (let r = 0; r < Math.min(5, sampleRows.length); r++) {
      const value = sampleRows[r]?.[i];
      if (value && value.trim()) {
        sampleValues.push(value.trim().slice(0, 100)); // Truncate long values
      }
    }

    mappings.push({
      sourceColumn: header,
      sourceIndex: i,
      targetField: assignment.field,
      confidence: assignment.confidence,
      isManual: false,
      sampleValues,
    });
  }

  return mappings;
}

/**
 * Detect delimiter from file content (for CSV)
 */
async function detectDelimiterFromFile(file: File): Promise<string> {
  const slice = file.slice(0, 8192); // First 8KB
  const text = await slice.text();
  return detectDelimiter(text);
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * React hook for client-side file parsing with progress and auto-mapping
 *
 * @example
 * ```tsx
 * const { parse, isParsing, progress, error, result } = useClientParser();
 *
 * const handleFileSelect = async (file: File) => {
 *   const result = await parse(file);
 *   if (result) {
 *     console.log('Parsed:', result.file.rowCount, 'rows');
 *     console.log('Mapped:', result.mapping.mappings.filter(m => m.targetField).length, 'columns');
 *   }
 * };
 * ```
 */
export function useClientParser(): UseClientParserReturn {
  const [progress, setProgress] = useState<ParsingProgress>(INITIAL_PROGRESS);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClientParseResult | null>(null);

  // Track if we should abort (for cleanup)
  const abortRef = useRef(false);

  /**
   * Validate a file without parsing
   */
  const validate = useCallback((file: File) => {
    return validateFile(file);
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    abortRef.current = true;
    setProgress(INITIAL_PROGRESS);
    setIsParsing(false);
    setError(null);
    setResult(null);
    // Reset abort flag after a tick
    setTimeout(() => {
      abortRef.current = false;
    }, 0);
  }, []);

  /**
   * Parse a file with progress tracking
   */
  const parse = useCallback(
    async (file: File, options?: ClientParseOptions): Promise<ClientParseResult | null> => {
      const opts = { ...DEFAULT_OPTIONS, ...options };
      abortRef.current = false;

      // Reset state
      setError(null);
      setResult(null);
      setIsParsing(true);
      setProgress({
        parsedRows: 0,
        totalRows: 0,
        phase: 'reading',
        percentage: 0,
      });

      try {
        // Validate first
        const validation = validateFile(file);
        if (!validation.valid) {
          setError(validation.error || 'Fichier invalide');
          setIsParsing(false);
          setProgress(INITIAL_PROGRESS);
          return null;
        }

        // Check for abort
        if (abortRef.current) return null;

        // Detect delimiter for CSV
        let detectedDelimiter = ',';
        const fileType = detectFileType(file);
        if (fileType === 'csv') {
          detectedDelimiter = await detectDelimiterFromFile(file);
        }

        // Progress callback
        const onProgress: ParseProgressCallback = (p) => {
          if (abortRef.current) return;
          setProgress({
            parsedRows: p.parsedRows,
            totalRows: p.totalRows,
            phase: p.phase,
            percentage: p.percentage,
          });
        };

        // Parse file with memory-safe row limit
        // Parse 1 extra row to detect if file exceeds limit
        const effectiveMaxRows = opts.maxRows > 0
          ? opts.maxRows
          : FILE_CONSTRAINTS.MAX_ROWS + 1;

        const parseResult = await parseFile(file, {
          onProgress,
          maxRows: effectiveMaxRows,
          sheetName: opts.sheetName || undefined,
          hasHeaderRow: opts.hasHeaderRow,
        });

        // Check for abort
        if (abortRef.current) return null;

        if (!parseResult.success || !parseResult.data) {
          setError(parseResult.error || 'Erreur lors de l\'analyse du fichier');
          setIsParsing(false);
          setProgress(INITIAL_PROGRESS);
          return null;
        }

        // Check row count limit (only if user didn't specify a custom maxRows)
        if (opts.maxRows === 0 && parseResult.data.rowCount > FILE_CONSTRAINTS.MAX_ROWS) {
          const formattedCount = parseResult.data.rowCount.toLocaleString('fr-FR');
          const formattedLimit = FILE_CONSTRAINTS.MAX_ROWS.toLocaleString('fr-FR');
          setError(
            `Le fichier contient ${formattedCount} lignes. Maximum autorisé: ${formattedLimit} lignes. Veuillez diviser le fichier.`
          );
          setIsParsing(false);
          setProgress(INITIAL_PROGRESS);
          return null;
        }

        // Update progress to mapping phase
        setProgress((prev) => ({
          ...prev,
          phase: 'mapping',
          percentage: 95,
        }));

        // Get sample rows for mapping preview
        const sampleRows = parseResult.data.rows
          .slice(0, 10)
          .map((r) => r.values);

        // Create auto-mappings
        const mappings = createAutoMappings(
          parseResult.data.headers,
          sampleRows,
          opts.minMappingConfidence
        );

        // Check for abort
        if (abortRef.current) return null;

        // Create mapping config
        const mappingConfig: ColumnMappingConfigV2 = {
          mappings,
          hasHeaderRow: opts.hasHeaderRow,
          headerRowIndex: opts.hasHeaderRow ? 0 : -1,
          encoding: 'utf-8', // Assumed for now
          delimiter: detectedDelimiter,
          sheetName: parseResult.data.selectedSheet,
        };

        // Build final result
        const finalResult: ClientParseResult = {
          file: parseResult.data,
          mapping: mappingConfig,
          durationMs: parseResult.durationMs,
        };

        // Update state
        setResult(finalResult);
        setProgress({
          parsedRows: parseResult.data.rowCount,
          totalRows: parseResult.data.rowCount,
          phase: 'complete',
          percentage: 100,
        });
        setIsParsing(false);

        return finalResult;
      } catch (err) {
        if (abortRef.current) return null;

        const message =
          err instanceof Error ? err.message : 'Erreur inattendue lors de l\'analyse';
        setError(message);
        setIsParsing(false);
        setProgress(INITIAL_PROGRESS);
        return null;
      }
    },
    []
  );

  return {
    progress,
    isParsing,
    error,
    result,
    parse,
    validate,
    reset,
  };
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Get mapping statistics
 */
export function getMappingStats(mappings: ColumnMappingV2[]): {
  total: number;
  mapped: number;
  unmapped: number;
  highConfidence: number;
  lowConfidence: number;
} {
  const mapped = mappings.filter((m) => m.targetField !== null);
  const highConfidence = mapped.filter((m) => m.confidence >= 0.9);
  const lowConfidence = mapped.filter((m) => m.confidence < 0.9 && m.confidence >= 0.7);

  return {
    total: mappings.length,
    mapped: mapped.length,
    unmapped: mappings.length - mapped.length,
    highConfidence: highConfidence.length,
    lowConfidence: lowConfidence.length,
  };
}

/**
 * Check if required contact fields are mapped
 */
export function hasRequiredContactField(mappings: ColumnMappingV2[]): boolean {
  const contactFields: LeadFieldKey[] = ['email', 'phone', 'external_id'];
  return mappings.some(
    (m) => m.targetField && contactFields.includes(m.targetField)
  );
}

/**
 * Get mapped fields list
 */
export function getMappedFields(mappings: ColumnMappingV2[]): LeadFieldKey[] {
  return mappings
    .filter((m) => m.targetField !== null)
    .map((m) => m.targetField as LeadFieldKey);
}
