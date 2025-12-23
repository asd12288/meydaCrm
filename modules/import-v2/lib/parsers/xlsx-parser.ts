/**
 * XLSX Parser for Import V2
 *
 * Client-side Excel parsing using ExcelJS.
 * Handles .xlsx and .xls files with multiple sheets.
 */

import ExcelJS from 'exceljs';
import type { ParsedFileV2, ParsedRowV2 } from '../../types';
import type { ParseOptions, ParseResult } from './index';
import { createParsedRow } from './index';

// =============================================================================
// XLSX PARSING
// =============================================================================

/**
 * Parse an XLSX/XLS file
 */
export async function parseXLSX(
  file: File,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const { onProgress, maxRows = 0, sheetName, hasHeaderRow = true } = options;
  const startTime = Date.now();

  return new Promise((resolve) => {
    // Report starting
    onProgress?.({
      parsedRows: 0,
      totalRows: 0,
      phase: 'reading',
      percentage: 0,
    });

    const reader = new FileReader();

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Erreur lors de la lecture du fichier',
        durationMs: Date.now() - startTime,
      });
    };

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;

        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          resolve({
            success: false,
            error: 'Le fichier est vide',
            durationMs: Date.now() - startTime,
          });
          return;
        }

        // Report parsing phase
        onProgress?.({
          parsedRows: 0,
          totalRows: 0,
          phase: 'parsing',
          percentage: 10,
        });

        // Load workbook
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        // Get available sheets
        const sheets = workbook.worksheets.map((ws) => ws.name);

        if (sheets.length === 0) {
          resolve({
            success: false,
            error: 'Le fichier ne contient pas de feuilles',
            durationMs: Date.now() - startTime,
          });
          return;
        }

        // Find target worksheet
        let worksheet: ExcelJS.Worksheet | undefined;

        if (sheetName) {
          worksheet = workbook.getWorksheet(sheetName);
          if (!worksheet) {
            resolve({
              success: false,
              error: `Feuille "${sheetName}" non trouvee`,
              durationMs: Date.now() - startTime,
            });
            return;
          }
        } else {
          worksheet = workbook.worksheets[0];
        }

        // Extract rows
        const allRows: string[][] = [];

        worksheet.eachRow({ includeEmpty: false }, (row) => {
          const rowValues = row.values as unknown[];

          // Skip empty rows
          if (!rowValues || rowValues.length <= 1) {
            return;
          }

          // Convert to string array (skip first element which is undefined in ExcelJS)
          const values = rowValues.slice(1).map((v) => getCellStringValue(v));
          allRows.push(values);
        });

        if (allRows.length === 0) {
          resolve({
            success: false,
            error: 'La feuille ne contient pas de donnees',
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

        const fileType = file.name.toLowerCase().endsWith('.xls') ? 'xls' : 'xlsx';

        const result: ParsedFileV2 = {
          name: file.name,
          size: file.size,
          type: fileType,
          headers,
          rowCount: rows.length,
          rows,
          sheets,
          selectedSheet: worksheet.name,
        };

        resolve({
          success: true,
          data: result,
          durationMs: Date.now() - startTime,
        });
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Erreur lors de l\'analyse du fichier Excel',
          durationMs: Date.now() - startTime,
        });
      }
    };

    reader.readAsArrayBuffer(file);
  });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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
      return richText.map((r) => r.text).join('');
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
    // Handle hyperlinks
    if ('hyperlink' in (value as object) && 'text' in (value as object)) {
      return String((value as { text: string }).text);
    }
  }

  return '';
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Get list of sheet names from an XLSX file
 */
export async function getXLSXSheetNames(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        const sheets = workbook.worksheets.map((ws) => ws.name);
        resolve(sheets);
      } catch (error) {
        reject(error);
      }
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Get a quick preview of XLSX file (headers + first N rows)
 */
export async function getXLSXPreview(
  file: File,
  maxRows: number = 5,
  sheetName?: string
): Promise<{ headers: string[]; sampleRows: string[][] } | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onerror = () => resolve(null);

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        const worksheet = sheetName
          ? workbook.getWorksheet(sheetName)
          : workbook.worksheets[0];

        if (!worksheet) {
          resolve(null);
          return;
        }

        const headers: string[] = [];
        const sampleRows: string[][] = [];
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
          sampleRows.push(values);
          rowCount++;
        });

        resolve({ headers, sampleRows });
      } catch {
        resolve(null);
      }
    };

    reader.readAsArrayBuffer(file);
  });
}
