/**
 * CSV Parser for Import V2
 *
 * Client-side CSV parsing using Papaparse.
 * Handles various delimiters, encodings, and edge cases.
 */

import Papa from 'papaparse';
import type { ParsedFileV2, ParsedRowV2 } from '../../types';
import type { ParseOptions, ParseResult } from './index';
import { createParsedRow, detectDelimiter } from './index';

// =============================================================================
// CSV PARSING
// =============================================================================

/**
 * Parse a CSV file
 */
export async function parseCSV(
  file: File,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const { onProgress, maxRows = 0, hasHeaderRow = true } = options;
  const startTime = Date.now();

  return new Promise((resolve) => {
    // Report starting
    onProgress?.({
      parsedRows: 0,
      totalRows: 0,
      phase: 'reading',
      percentage: 0,
    });

    // Read file as text to detect delimiter
    const reader = new FileReader();

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Erreur lors de la lecture du fichier',
        durationMs: Date.now() - startTime,
      });
    };

    reader.onload = (event) => {
      const content = event.target?.result as string;

      if (!content || content.trim().length === 0) {
        resolve({
          success: false,
          error: 'Le fichier est vide',
          durationMs: Date.now() - startTime,
        });
        return;
      }

      // Detect delimiter
      const delimiter = detectDelimiter(content);

      // Report parsing phase
      onProgress?.({
        parsedRows: 0,
        totalRows: 0,
        phase: 'parsing',
        percentage: 10,
      });

      // Parse with papaparse
      const parseResult = Papa.parse<string[]>(content, {
        header: false,
        skipEmptyLines: true,
        delimiter,
        // Don't dynamically type - keep everything as strings
        dynamicTyping: false,
      });

      // Check for parse errors
      if (parseResult.errors.length > 0) {
        const firstError = parseResult.errors[0];
        const errorRow = firstError.row ?? 0;
        resolve({
          success: false,
          error: `Erreur d'analyse a la ligne ${errorRow + 1}: ${firstError.message}`,
          durationMs: Date.now() - startTime,
        });
        return;
      }

      const allRows = parseResult.data;

      if (allRows.length === 0) {
        resolve({
          success: false,
          error: 'Le fichier ne contient pas de donnees',
          durationMs: Date.now() - startTime,
        });
        return;
      }

      // Extract headers
      let headers: string[] = [];
      let dataStartIndex = 0;

      if (hasHeaderRow) {
        headers = allRows[0].map((h) => (h || '').trim());
        dataStartIndex = 1;

        if (headers.length === 0 || headers.every((h) => !h)) {
          resolve({
            success: false,
            error: 'La ligne d\'en-tete est vide',
            durationMs: Date.now() - startTime,
          });
          return;
        }
      } else {
        // Generate column names A, B, C, ...
        const firstRow = allRows[0] || [];
        headers = firstRow.map((_, i) => String.fromCharCode(65 + (i % 26)));
      }

      // Parse data rows
      const rows: ParsedRowV2[] = [];
      const totalDataRows = allRows.length - dataStartIndex;
      const rowsToProcess = maxRows > 0 ? Math.min(maxRows, totalDataRows) : totalDataRows;

      for (let i = 0; i < rowsToProcess; i++) {
        const rowIndex = dataStartIndex + i;
        const rawRow = allRows[rowIndex];

        if (!rawRow || rawRow.every((cell) => !cell || !cell.trim())) {
          continue; // Skip empty rows
        }

        const parsedRow = createParsedRow(i + 1, rawRow);
        rows.push(parsedRow);

        // Report progress every 100 rows
        if (i > 0 && i % 100 === 0) {
          onProgress?.({
            parsedRows: i,
            totalRows: rowsToProcess,
            phase: 'parsing',
            percentage: 10 + Math.round((i / rowsToProcess) * 80),
          });
        }
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
    };

    reader.readAsText(file);
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
