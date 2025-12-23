/**
 * Import V2 Parsers
 *
 * Unified interface for CSV and XLSX parsing.
 * All parsing happens client-side for better performance.
 */

import type { ParsedFileV2, ParsedRowV2, FileType } from '../../types';

// =============================================================================
// PARSER INTERFACE
// =============================================================================

/**
 * Progress callback during parsing
 */
export type ParseProgressCallback = (progress: {
  /** Rows parsed so far */
  parsedRows: number;
  /** Total rows (may be estimated initially) */
  totalRows: number;
  /** Current phase */
  phase: 'reading' | 'parsing' | 'complete';
  /** Progress percentage (0-100) */
  percentage: number;
}) => void;

/**
 * Options for file parsing
 */
export interface ParseOptions {
  /** Callback for progress updates */
  onProgress?: ParseProgressCallback;
  /** Maximum rows to parse (for preview, 0 = all) */
  maxRows?: number;
  /** Sheet name to parse (for Excel files) */
  sheetName?: string;
  /** Whether file has header row */
  hasHeaderRow?: boolean;
}

/**
 * Result of file parsing
 */
export interface ParseResult {
  /** Whether parsing succeeded */
  success: boolean;
  /** Parsed file data */
  data?: ParsedFileV2;
  /** Error message if failed */
  error?: string;
  /** Duration in milliseconds */
  durationMs: number;
}

// =============================================================================
// FILE TYPE DETECTION
// =============================================================================

/**
 * Detect file type from file name or MIME type
 */
export function detectFileType(file: File): FileType | null {
  const extension = file.name.toLowerCase().split('.').pop();

  switch (extension) {
    case 'csv':
      return 'csv';
    case 'xlsx':
      return 'xlsx';
    case 'xls':
      return 'xls';
    default:
      // Try MIME type
      if (file.type === 'text/csv') return 'csv';
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        return 'xlsx';
      if (file.type === 'application/vnd.ms-excel') return 'xls';
      return null;
  }
}

/**
 * Validate file can be parsed
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const fileType = detectFileType(file);

  if (!fileType) {
    return {
      valid: false,
      error: 'Format de fichier non supporte. Utilisez CSV ou Excel (.xlsx, .xls).',
    };
  }

  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: 'Fichier trop volumineux. Taille maximale: 50 MB.',
    };
  }

  return { valid: true };
}

// =============================================================================
// DELIMITER DETECTION
// =============================================================================

/**
 * Auto-detect CSV delimiter from file content
 */
export function detectDelimiter(sample: string): string {
  const firstLines = sample.split('\n').slice(0, 5).join('\n');
  const delimiters = [',', ';', '\t', '|'];

  let bestDelimiter = ',';
  let maxCount = 0;

  for (const d of delimiters) {
    const regex = new RegExp(d === '|' ? '\\|' : d, 'g');
    const count = (firstLines.match(regex) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = d;
    }
  }

  return bestDelimiter;
}

// =============================================================================
// ROW CONVERSION UTILITY
// =============================================================================

/**
 * Convert raw row values to ParsedRowV2
 */
export function createParsedRow(
  rowNumber: number,
  values: string[]
): ParsedRowV2 {
  return {
    rowNumber,
    values: values.map((v) => (v || '').trim()),
  };
}

// =============================================================================
// RE-EXPORT PARSERS
// =============================================================================

export { parseCSV } from './csv-parser';
export { parseXLSX, getXLSXSheetNames } from './xlsx-parser';

// =============================================================================
// UNIFIED PARSE FUNCTION
// =============================================================================

import { parseCSV } from './csv-parser';
import { parseXLSX } from './xlsx-parser';

/**
 * Parse a file (auto-detect type)
 */
export async function parseFile(
  file: File,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const startTime = Date.now();

  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      durationMs: Date.now() - startTime,
    };
  }

  const fileType = detectFileType(file)!;

  try {
    let result: ParseResult;

    if (fileType === 'csv') {
      result = await parseCSV(file, options);
    } else {
      result = await parseXLSX(file, options);
    }

    return {
      ...result,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'analyse du fichier',
      durationMs: Date.now() - startTime,
    };
  }
}
