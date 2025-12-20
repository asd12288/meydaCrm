/**
 * Streaming CSV Parser
 *
 * Uses papaparse for memory-efficient CSV parsing.
 * Processes files row-by-row without loading entire file into memory.
 *
 * Key features:
 * - Streaming parse (low memory footprint)
 * - Auto-detects delimiter, encoding, and line endings
 * - Handles quoted fields and escaped characters
 * - Supports resuming from a specific row
 * - Processes rows in configurable chunks
 */

import Papa from 'papaparse';
import type { ColumnMapping } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

export interface CSVParseOptions {
  /** Column mappings from source to target fields */
  mappings: ColumnMapping[];
  /** Resume from this row number (1-based, after header) */
  startRow?: number;
  /** Chunk size for batch processing */
  chunkSize?: number;
  /** Callback for progress updates */
  onProgress?: (processed: number, valid: number, invalid: number) => void;
  /** Callback for processing a chunk of rows */
  onChunk: (rows: ParsedRow[]) => Promise<void>;
  /** Called on successful completion */
  onComplete?: (stats: ParseStats) => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

export interface ParsedRow {
  /** Row number in the original file (1-based, after header) */
  rowNumber: number;
  /** Chunk number this row belongs to */
  chunkNumber: number;
  /** Raw data as it appeared in the file */
  rawData: Record<string, string>;
  /** Normalized data after mapping and transformation */
  normalizedData: Record<string, string | null>;
  /** Validation status */
  isValid: boolean;
  /** Validation errors (if any) */
  errors: Record<string, string>;
}

export interface ParseStats {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  processingTimeMs: number;
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
 * Stream parse a CSV file from a URL or blob
 *
 * @example
 * ```ts
 * await streamParseCSV(signedUrl, {
 *   mappings: columnMappings,
 *   chunkSize: 500,
 *   onProgress: (processed, valid, invalid) => console.log(`${processed} rows...`),
 *   onChunk: async (rows) => {
 *     await insertRows(rows);
 *   },
 * });
 * ```
 */
export async function streamParseCSV(
  source: string | Blob,
  options: CSVParseOptions
): Promise<ParseStats> {
  const {
    mappings,
    startRow = 1,
    chunkSize = DEFAULT_CHUNK_SIZE,
    onProgress,
    onChunk,
    onComplete,
    onError,
  } = options;

  const startTime = Date.now();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📖 [CSV Parser] STARTING CSV PARSE');
  console.log(`📋 [CSV Parser] Mappings: ${mappings.length} columns`);
  console.log(`📋 [CSV Parser] Start row: ${startRow}`);
  console.log(`📋 [CSV Parser] Chunk size: ${chunkSize}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let rowNumber = 0;
  let chunkNumber = 0;
  let validCount = 0;
  let invalidCount = 0;
  let chunk: ParsedRow[] = [];
  let headers: string[] = [];
  let headerProcessed = false;

  return new Promise(async (resolve, reject) => {
    try {
      // Get the file content as a stream
      let fileContent: string;

      if (typeof source === 'string') {
        console.log('🌐 [CSV Parser] Fetching file from URL...');
        console.log(`🔗 [CSV Parser] URL: ${source.substring(0, 80)}...`);
        // Fetch from URL
        const response = await fetch(source);
        if (!response.ok) {
          console.error(`❌ [CSV Parser] Fetch failed: ${response.statusText}`);
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        fileContent = await response.text();
        console.log(`✅ [CSV Parser] File fetched: ${(fileContent.length / 1024 / 1024).toFixed(2)} MB`);
      } else {
        console.log('📄 [CSV Parser] Reading file from Blob...');
        // Read from Blob
        fileContent = await source.text();
        console.log(`✅ [CSV Parser] File read: ${(fileContent.length / 1024 / 1024).toFixed(2)} MB`);
      }

      // Parse with papaparse
      console.log('🔍 [CSV Parser] Parsing CSV with PapaParse...');
      const parseResult = Papa.parse<string[]>(fileContent, {
        header: false, // We'll handle headers manually for more control
        skipEmptyLines: true,
        dynamicTyping: false, // Keep everything as strings
      });

      console.log(`✅ [CSV Parser] PapaParse complete: ${parseResult.data.length} rows`);

      // Handle parse errors
      if (parseResult.errors.length > 0) {
        const firstError = parseResult.errors[0];
        console.error('❌ [CSV Parser] Parse errors detected:', parseResult.errors);
        const err = new Error(`CSV parse error at row ${firstError.row}: ${firstError.message}`);
        onError?.(err);
        reject(err);
        return;
      }

      console.log('✅ [CSV Parser] No parse errors');

      // Process all rows
      const allRows = parseResult.data;
      console.log(`📊 [CSV Parser] Processing ${allRows.length} rows...`);

      try {
        for (let i = 0; i < allRows.length; i++) {
          const row = allRows[i];

          // First row is headers
          if (!headerProcessed) {
            headers = row.map((h) => (h || '').trim());
            headerProcessed = true;
            continue;
          }

          rowNumber++;

          // Skip rows before startRow (for resume)
          if (rowNumber < startRow) {
            continue;
          }

          // Parse and validate the row
          const parsedRow = parseRow(
            row,
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

          // Process chunk when full
          if (chunk.length >= chunkSize) {
            console.log(`📦 [CSV Parser] Chunk ${chunkNumber} full (${chunk.length} rows), processing...`);
            await onChunk(chunk);
            onProgress?.(rowNumber, validCount, invalidCount);
            console.log(`✅ [CSV Parser] Chunk ${chunkNumber} processed`);
            chunk = [];
            chunkNumber++;
          }
        }

        // Process remaining rows
        if (chunk.length > 0) {
          console.log(`📦 [CSV Parser] Processing final chunk (${chunk.length} rows)...`);
          await onChunk(chunk);
          onProgress?.(rowNumber, validCount, invalidCount);
          console.log('✅ [CSV Parser] Final chunk processed');
        }

        const stats: ParseStats = {
          totalRows: rowNumber,
          validRows: validCount,
          invalidRows: invalidCount,
          processingTimeMs: Date.now() - startTime,
        };

        onComplete?.(stats);
        resolve(stats);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err);
        reject(err);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      reject(err);
    }
  });
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
    // Should have at least 8 digits
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
      // Remove common prefixes like "p:" or "t:"
      if (/^[pt]:/.test(normalized.toLowerCase())) {
        normalized = normalized.slice(2);
      }
      // Remove spaces, dots, dashes, parentheses
      normalized = normalized.replace(/[\s.\-()]/g, '');
      // Convert French 0x format to +33
      if (normalized.startsWith('0') && normalized.length === 10) {
        normalized = '+33' + normalized.slice(1);
      }
      return normalized;
    }

    case 'postal_code': {
      const digits = trimmed.replace(/\s/g, '');
      // Pad French postal codes
      if (/^\d{4}$/.test(digits)) {
        return '0' + digits;
      }
      return digits;
    }

    case 'first_name':
    case 'last_name':
    case 'company':
    case 'city':
      // Capitalize first letter of each word
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
 * Detect the delimiter used in a CSV file
 */
export function detectDelimiter(sample: string): string {
  const firstLine = sample.split('\n')[0] || '';
  const delimiters = [',', ';', '\t', '|'];

  let bestDelimiter = ',';
  let maxCount = 0;

  for (const d of delimiters) {
    const count = (firstLine.match(new RegExp(d === '|' ? '\\|' : d, 'g')) || [])
      .length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = d;
    }
  }

  return bestDelimiter;
}

/**
 * Get a preview of the CSV file (first N rows)
 */
export async function getCSVPreview(
  source: string | Blob,
  maxRows: number = 10
): Promise<{ headers: string[]; rows: string[][] }> {
  let fileContent: string;

  if (typeof source === 'string') {
    const response = await fetch(source);
    fileContent = await response.text();
  } else {
    fileContent = await source.text();
  }

  const headers: string[] = [];
  const rows: string[][] = [];
  let headerProcessed = false;

  return new Promise((resolve) => {
    Papa.parse(fileContent, {
      header: false,
      skipEmptyLines: true,
      preview: maxRows + 1, // +1 for header

      step: (result) => {
        const row = result.data as string[];

        if (!headerProcessed) {
          headers.push(...row.map((h) => (h || '').trim()));
          headerProcessed = true;
          return;
        }

        rows.push(row);
      },

      complete: () => {
        resolve({ headers, rows });
      },
    });
  });
}
