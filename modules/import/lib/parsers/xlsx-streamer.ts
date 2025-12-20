/**
 * Streaming XLSX Parser
 *
 * Uses ExcelJS for XLSX parsing.
 * Processes files row-by-row for memory efficiency.
 *
 * Note: ExcelJS streaming API requires Node.js streams.
 * For server-side use, we use the regular Workbook reader
 * which is still efficient for files up to ~100MB.
 */

import ExcelJS from 'exceljs';
import type { ColumnMapping } from '../../types';
import type { ParsedRow, ParseStats, CSVParseOptions } from './csv-streamer';

// Re-export types for convenience
export type { ParsedRow, ParseStats };

// ============================================================================
// TYPES
// ============================================================================

export interface XLSXParseOptions extends Omit<CSVParseOptions, 'mappings'> {
  /** Column mappings from source to target fields */
  mappings: ColumnMapping[];
  /** Sheet name or index to parse (default: first sheet) */
  sheetName?: string | number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CHUNK_SIZE = 500;
const REQUIRED_CONTACT_FIELDS = ['email', 'phone', 'external_id'];

// ============================================================================
// MAIN PARSER
// ============================================================================

/**
 * Parse an XLSX file from a URL or buffer
 *
 * @example
 * ```ts
 * await streamParseXLSX(fileBuffer, {
 *   mappings: columnMappings,
 *   chunkSize: 500,
 *   onProgress: (processed, valid, invalid) => console.log(`${processed} rows...`),
 *   onChunk: async (rows) => {
 *     await insertRows(rows);
 *   },
 * });
 * ```
 */
export async function streamParseXLSX(
  source: string | Buffer | ArrayBuffer,
  options: XLSXParseOptions
): Promise<ParseStats> {
  const {
    mappings,
    startRow = 1,
    chunkSize = DEFAULT_CHUNK_SIZE,
    sheetName,
    onProgress,
    onChunk,
    onComplete,
    onError,
  } = options;

  const startTime = Date.now();

  let rowNumber = 0;
  let chunkNumber = 0;
  let validCount = 0;
  let invalidCount = 0;
  let chunk: ParsedRow[] = [];
  let headers: string[] = [];

  try {
    // Get the file as ArrayBuffer for ExcelJS
    let arrayBuffer: ArrayBuffer;

    if (typeof source === 'string') {
      // Fetch from URL
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      arrayBuffer = await response.arrayBuffer();
    } else if (source instanceof ArrayBuffer) {
      arrayBuffer = source;
    } else {
      // Buffer - convert to ArrayBuffer
      arrayBuffer = source.buffer.slice(
        source.byteOffset,
        source.byteOffset + source.byteLength
      ) as ArrayBuffer;
    }

    // Create workbook and load from ArrayBuffer
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    // Find the target worksheet
    let worksheet: ExcelJS.Worksheet | undefined;

    if (typeof sheetName === 'string') {
      worksheet = workbook.getWorksheet(sheetName);
    } else if (typeof sheetName === 'number') {
      worksheet = workbook.worksheets[sheetName];
    } else {
      worksheet = workbook.worksheets[0];
    }

    if (!worksheet) {
      throw new Error(
        sheetName
          ? `Sheet "${sheetName}" not found in workbook`
          : 'Workbook has no worksheets'
      );
    }

    // Process rows
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const rowValues = row.values as (string | number | null | ExcelJS.CellValue)[];

      // Skip empty rows
      if (!rowValues || rowValues.length <= 1) {
        return;
      }

      // First non-empty row is headers
      if (headers.length === 0) {
        headers = rowValues.slice(1).map((v) => getCellStringValue(v));
        return;
      }

      rowNumber++;

      // Skip rows before startRow (for resume)
      if (rowNumber < startRow) {
        return;
      }

      // Convert row values to string array
      const values = rowValues.slice(1).map((v) => getCellStringValue(v));

      // Parse and validate the row
      const parsedRow = parseRow(
        values,
        headers,
        rowNumber,
        chunkNumber,
        mappings
      );

      if (parsedRow.isValid) {
        validCount++;
      } else {
        invalidCount++;
      }

      chunk.push(parsedRow);
    });

    // Process any remaining rows in chunks
    // Since eachRow is synchronous, we process chunks after
    const allRows = chunk;
    chunk = [];

    for (let i = 0; i < allRows.length; i += chunkSize) {
      const currentChunk = allRows.slice(i, i + chunkSize);

      try {
        await onChunk(currentChunk);
        onProgress?.(i + currentChunk.length, validCount, invalidCount);
      } catch (error) {
        throw error;
      }

      chunkNumber++;
    }

    const stats: ParseStats = {
      totalRows: rowNumber,
      validRows: validCount,
      invalidRows: invalidCount,
      processingTimeMs: Date.now() - startTime,
    };

    onComplete?.(stats);
    return stats;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    throw err;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract string value from ExcelJS cell value
 */
function getCellStringValue(value: unknown): string {
  if (value === null || value === undefined) return '';

  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';

  // Handle ExcelJS rich text
  if (typeof value === 'object') {
    if ('richText' in (value as object)) {
      const richText = (value as { richText: Array<{ text: string }> }).richText;
      return richText.map(r => r.text).join('');
    }
    if ('text' in (value as object)) {
      return String((value as { text: string }).text);
    }
    if ('result' in (value as object)) {
      return String((value as { result: unknown }).result);
    }
    // Handle Date objects
    if (value instanceof Date) {
      return value.toISOString();
    }
  }

  return '';
}

// ============================================================================
// ROW PROCESSING
// ============================================================================

/**
 * Parse a single row, applying mappings and validation
 */
function parseRow(
  row: string[],
  headers: string[],
  rowNumber: number,
  chunkNumber: number,
  mappings: ColumnMapping[]
): ParsedRow {
  const rawData: Record<string, string> = {};
  const normalizedData: Record<string, string | null> = {};
  const errors: Record<string, string> = {};

  // Build raw data from headers
  headers.forEach((header, index) => {
    rawData[header] = row[index] || '';
  });

  // Apply mappings
  for (const mapping of mappings) {
    const value = row[mapping.sourceIndex]?.trim() || '';

    if (mapping.targetField && value) {
      normalizedData[mapping.targetField] = normalizeValue(
        mapping.targetField,
        value
      );
    }
  }

  // Validate: must have at least one contact field
  const hasContact = REQUIRED_CONTACT_FIELDS.some(
    (field) => normalizedData[field]
  );
  if (!hasContact) {
    errors['contact'] =
      'Au moins un champ de contact requis (email, téléphone ou ID externe)';
  }

  // Validate email format
  if (normalizedData['email']) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedData['email'])) {
      errors['email'] = 'Format email invalide';
    }
  }

  // Validate phone format (basic check)
  if (normalizedData['phone']) {
    const phone = normalizedData['phone'];
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8) {
      errors['phone'] = 'Numéro de téléphone trop court';
    }
  }

  return {
    rowNumber,
    chunkNumber,
    rawData,
    normalizedData,
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Normalize a field value based on its type
 */
function normalizeValue(field: string, value: string): string | null {
  if (!value || value.trim() === '') return null;

  const trimmed = value.trim();

  switch (field) {
    case 'email':
      return trimmed.toLowerCase();

    case 'phone': {
      let normalized = trimmed;
      if (/^[pt]:/.test(normalized.toLowerCase())) {
        normalized = normalized.slice(2);
      }
      normalized = normalized.replace(/[\s.\-()]/g, '');
      if (normalized.startsWith('0') && normalized.length === 10) {
        normalized = '+33' + normalized.slice(1);
      }
      return normalized;
    }

    case 'postal_code': {
      const digits = trimmed.replace(/\s/g, '');
      if (/^\d{4}$/.test(digits)) {
        return '0' + digits;
      }
      return digits;
    }

    case 'first_name':
    case 'last_name':
    case 'company':
    case 'city':
      return trimmed
        .toLowerCase()
        .replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());

    default:
      return trimmed.replace(/\s+/g, ' ');
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get a preview of the XLSX file (first N rows)
 */
export async function getXLSXPreview(
  source: string | Buffer | ArrayBuffer,
  maxRows: number = 10,
  sheetName?: string | number
): Promise<{ headers: string[]; rows: string[][] }> {
  let arrayBuffer: ArrayBuffer;

  if (typeof source === 'string') {
    const response = await fetch(source);
    arrayBuffer = await response.arrayBuffer();
  } else if (source instanceof ArrayBuffer) {
    arrayBuffer = source;
  } else {
    // Buffer - convert to ArrayBuffer
    arrayBuffer = source.buffer.slice(
      source.byteOffset,
      source.byteOffset + source.byteLength
    ) as ArrayBuffer;
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  let worksheet: ExcelJS.Worksheet | undefined;

  if (typeof sheetName === 'string') {
    worksheet = workbook.getWorksheet(sheetName);
  } else if (typeof sheetName === 'number') {
    worksheet = workbook.worksheets[sheetName];
  } else {
    worksheet = workbook.worksheets[0];
  }

  if (!worksheet) {
    return { headers: [], rows: [] };
  }

  const headers: string[] = [];
  const rows: string[][] = [];
  let rowCount = 0;

  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const rowValues = row.values as unknown[];

    if (!rowValues || rowValues.length <= 1) {
      return;
    }

    if (headers.length === 0) {
      headers.push(...rowValues.slice(1).map((v) => getCellStringValue(v)));
      return;
    }

    if (rowCount >= maxRows) {
      return;
    }

    const values = rowValues.slice(1).map((v) => getCellStringValue(v));
    rows.push(values);
    rowCount++;
  });

  return { headers, rows };
}

/**
 * Get list of sheet names in an XLSX file
 */
export async function getXLSXSheetNames(
  source: string | Buffer | ArrayBuffer
): Promise<string[]> {
  let arrayBuffer: ArrayBuffer;

  if (typeof source === 'string') {
    const response = await fetch(source);
    arrayBuffer = await response.arrayBuffer();
  } else if (source instanceof ArrayBuffer) {
    arrayBuffer = source;
  } else {
    // Buffer - convert to ArrayBuffer
    arrayBuffer = source.buffer.slice(
      source.byteOffset,
      source.byteOffset + source.byteLength
    ) as ArrayBuffer;
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  return workbook.worksheets.map((ws) => ws.name);
}
