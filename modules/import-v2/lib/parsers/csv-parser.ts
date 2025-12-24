/**
 * CSV Parser for Import V2
 *
 * Client-side CSV parsing using Papaparse with STREAMING mode.
 * Early termination when maxRows exceeded to prevent memory exhaustion.
 * Handles various delimiters, encodings, and edge cases.
 */

import Papa from 'papaparse';
import type { ParsedFileV2, ParsedRowV2 } from '../../types';
import type { ParseOptions, ParseResult } from './index';
import { createParsedRow, detectDelimiter } from './index';

// =============================================================================
// CSV PARSING WITH STREAMING
// =============================================================================

/**
 * Read a small sample of the file to detect delimiter
 * Only reads the first 8KB to be memory-efficient
 */
async function detectDelimiterFromFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    const sampleSize = Math.min(8192, file.size); // First 8KB
    const blob = file.slice(0, sampleSize);

    reader.onload = (event) => {
      const content = event.target?.result as string;
      resolve(detectDelimiter(content || ''));
    };
    reader.onerror = () => resolve(','); // Default to comma on error
    reader.readAsText(blob);
  });
}

/**
 * Parse a CSV file using STREAMING mode with early termination
 * Memory-efficient: only keeps maxRows in memory, aborts reading when limit reached
 */
export async function parseCSV(
  file: File,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const { onProgress, maxRows = 0, hasHeaderRow = true } = options;
  const startTime = Date.now();

  // Report starting
  onProgress?.({
    parsedRows: 0,
    totalRows: 0,
    phase: 'reading',
    percentage: 0,
  });

  // First, detect delimiter from a small sample (memory efficient)
  const delimiter = await detectDelimiterFromFile(file);

  // Report parsing phase
  onProgress?.({
    parsedRows: 0,
    totalRows: maxRows || 0,
    phase: 'parsing',
    percentage: 10,
  });

  return new Promise((resolve) => {
    let headers: string[] = [];
    const rows: ParsedRowV2[] = [];
    let rowIndex = 0;
    let isFirstRow = true;
    let headersParsed = false;
    let wasAborted = false;
    let parseError: string | null = null;

    // Use PapaParse streaming mode for memory efficiency
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      delimiter,
      dynamicTyping: false,

      // STREAMING: Called for each row
      step: (result, parser) => {
        // Handle parse errors
        if (result.errors.length > 0) {
          const firstError = result.errors[0];
          parseError = `Erreur d'analyse a la ligne ${rowIndex + 1}: ${firstError.message}`;
          parser.abort();
          return;
        }

        const rawRow = result.data;

        // First row: extract headers
        if (isFirstRow) {
          isFirstRow = false;

          if (hasHeaderRow) {
            headers = rawRow.map((h) => (h || '').trim());

            if (headers.length === 0 || headers.every((h) => !h)) {
              parseError = 'La ligne d\'en-tete est vide';
              parser.abort();
              return;
            }
            headersParsed = true;
            return; // Don't count header as data row
          } else {
            // Generate column names A, B, C, ...
            headers = rawRow.map((_, i) => String.fromCharCode(65 + (i % 26)));
            headersParsed = true;
            // Continue to process this row as data
          }
        }

        // Skip empty rows
        if (!rawRow || rawRow.every((cell) => !cell || !cell.trim())) {
          return;
        }

        // EARLY TERMINATION: Stop when limit reached
        if (maxRows > 0 && rows.length >= maxRows) {
          wasAborted = true;
          parser.abort(); // Stops reading file immediately
          return;
        }

        // Create parsed row
        rowIndex++;
        const parsedRow = createParsedRow(rowIndex, rawRow);
        rows.push(parsedRow);

        // Report progress every 100 rows
        if (rows.length % 100 === 0) {
          const percentage = maxRows > 0
            ? 10 + Math.round((rows.length / maxRows) * 80)
            : 50; // Unknown total if no maxRows
          onProgress?.({
            parsedRows: rows.length,
            totalRows: maxRows || rows.length,
            phase: 'parsing',
            percentage,
          });
        }
      },

      // Called when parsing is complete (or aborted)
      complete: () => {
        // Handle parse errors
        if (parseError) {
          resolve({
            success: false,
            error: parseError,
            durationMs: Date.now() - startTime,
          });
          return;
        }

        // Check if we got any data
        if (!headersParsed) {
          resolve({
            success: false,
            error: 'Le fichier est vide',
            durationMs: Date.now() - startTime,
          });
          return;
        }

        if (rows.length === 0) {
          resolve({
            success: false,
            error: 'Le fichier ne contient pas de donnees',
            durationMs: Date.now() - startTime,
          });
          return;
        }

        // Report complete
        onProgress?.({
          parsedRows: rows.length,
          totalRows: rows.length,
          phase: 'complete',
          percentage: 100,
        });

        const result: ParsedFileV2 = {
          name: file.name,
          size: file.size,
          type: 'csv',
          headers,
          rowCount: rows.length,
          rows,
        };

        resolve({
          success: true,
          data: result,
          durationMs: Date.now() - startTime,
        });
      },

      // Handle file read errors
      error: (error) => {
        resolve({
          success: false,
          error: `Erreur lors de la lecture du fichier: ${error.message}`,
          durationMs: Date.now() - startTime,
        });
      },
    });
  });
}

/**
 * Get a quick preview of CSV file (headers + first N rows)
 */
export async function getCSVPreview(
  file: File,
  maxRows: number = 5
): Promise<{ headers: string[]; sampleRows: string[][] } | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onerror = () => resolve(null);

    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        resolve(null);
        return;
      }

      const delimiter = detectDelimiter(content);

      const parseResult = Papa.parse<string[]>(content, {
        header: false,
        skipEmptyLines: true,
        delimiter,
        preview: maxRows + 1, // +1 for header
      });

      if (parseResult.data.length === 0) {
        resolve(null);
        return;
      }

      const headers = parseResult.data[0].map((h) => (h || '').trim());
      const sampleRows = parseResult.data.slice(1);

      resolve({ headers, sampleRows });
    };

    reader.readAsText(file);
  });
}
