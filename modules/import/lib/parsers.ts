/**
 * File parsing utilities for CSV and Excel files
 *
 * This module handles client-side parsing of uploaded files.
 * Excel files are converted to CSV client-side using SheetJS.
 * For large files, parsing is done in chunks to avoid blocking the UI.
 */

import * as XLSX from 'xlsx';
import type { RawRow, LeadFieldKey } from '../types';
import type { ColumnMapping } from '../types/mapping';

// =============================================================================
// EXCEL PARSING (Client-side with SheetJS)
// =============================================================================

/**
 * Parse Excel file and return structured data
 */
export async function parseExcelFile(file: File): Promise<{
  headers: string[];
  rows: string[][];
  sheetName: string;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  // Get first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Fichier Excel vide ou invalide');
  }

  const sheet = workbook.Sheets[sheetName];

  // Convert to array of arrays
  const data: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false, // Convert all values to strings
  });

  if (data.length === 0) {
    throw new Error('Feuille Excel vide');
  }

  // First row is headers
  const headers = data[0].map((h) => String(h || '').trim());
  const rows = data.slice(1).map((row) => row.map((cell) => String(cell || '').trim()));

  // Filter out completely empty rows
  const nonEmptyRows = rows.filter((row) => row.some((cell) => cell !== ''));

  return { headers, rows: nonEmptyRows, sheetName };
}

/**
 * Convert Excel data to CSV string
 */
export function convertToCSV(headers: string[], rows: string[][]): string {
  const escapeCSV = (value: string): string => {
    // If value contains comma, newline, or quote, wrap in quotes
    if (value.includes(',') || value.includes('\n') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map((row) => row.map(escapeCSV).join(','));

  return [headerLine, ...dataLines].join('\n');
}

/**
 * Convert Excel file to CSV File object
 */
export async function convertExcelToCSV(excelFile: File): Promise<{
  csvFile: File;
  headers: string[];
  rowCount: number;
  originalName: string;
}> {
  const { headers, rows } = await parseExcelFile(excelFile);
  const csvContent = convertToCSV(headers, rows);

  // Create new CSV file with same name but .csv extension
  const baseName = excelFile.name.replace(/\.(xlsx|xls)$/i, '');
  const csvFileName = `${baseName}.csv`;

  const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const csvFile = new File([csvBlob], csvFileName, { type: 'text/csv' });

  return {
    csvFile,
    headers,
    rowCount: rows.length,
    originalName: excelFile.name,
  };
}

// =============================================================================
// CSV PARSING
// =============================================================================

/**
 * Detect CSV delimiter by analyzing the first few lines
 */
export function detectDelimiter(content: string): string {
  const firstLine = content.split('\n')[0] || '';
  const delimiters = [',', ';', '\t', '|'];
  const counts: Record<string, number> = {};

  for (const delimiter of delimiters) {
    counts[delimiter] = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
  }

  // Return delimiter with highest count
  let maxDelimiter = ',';
  let maxCount = 0;

  for (const [delimiter, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxDelimiter = delimiter;
    }
  }

  return maxDelimiter;
}

/**
 * Parse a CSV line handling quoted fields
 */
export function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Don't forget the last field
  result.push(current.trim());

  return result;
}

/**
 * Parse CSV content and return structured data
 */
export function parseCSVContent(
  content: string,
  options: {
    hasHeader?: boolean;
    delimiter?: string;
    maxRows?: number;
  } = {}
): {
  headers: string[];
  rows: RawRow[];
  delimiter: string;
} {
  const { hasHeader = true, maxRows } = options;
  const delimiter = options.delimiter || detectDelimiter(content);

  // Split into lines, handling both \r\n and \n
  const lines = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.trim() !== '');

  if (lines.length === 0) {
    return { headers: [], rows: [], delimiter };
  }

  // Parse header row
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine, delimiter);

  // Parse data rows
  const rows: RawRow[] = [];
  const startRow = hasHeader ? 1 : 0;
  const endRow = maxRows ? Math.min(startRow + maxRows, lines.length) : lines.length;

  for (let i = startRow; i < endRow; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = parseCSVLine(line, delimiter);
    rows.push({
      rowNumber: i + 1, // 1-based for display
      values,
      rawLine: line,
    });
  }

  return { headers, rows, delimiter };
}

// =============================================================================
// DATA TRANSFORMATION
// =============================================================================

/**
 * Apply column mapping to raw rows
 */
export function applyColumnMapping(
  rows: RawRow[],
  mappings: ColumnMapping[]
): Array<{ rowNumber: number; data: Partial<Record<LeadFieldKey, string>> }> {
  return rows.map((row) => {
    const data: Partial<Record<LeadFieldKey, string>> = {};

    for (const mapping of mappings) {
      if (mapping.targetField && row.values[mapping.sourceIndex] !== undefined) {
        const value = row.values[mapping.sourceIndex];
        if (value && value.trim() !== '') {
          data[mapping.targetField] = value.trim();
        }
      }
    }

    return {
      rowNumber: row.rowNumber,
      data,
    };
  });
}

// =============================================================================
// FILE READING UTILITIES
// =============================================================================

/**
 * Read file as text with encoding detection
 */
export async function readFileAsText(file: File): Promise<{
  content: string;
  encoding: string;
}> {
  // Try UTF-8 first
  try {
    const content = await file.text();
    // Check for BOM and encoding issues
    const cleanContent = content.replace(/^\uFEFF/, ''); // Remove UTF-8 BOM
    return { content: cleanContent, encoding: 'UTF-8' };
  } catch {
    // Fall back to reading as ArrayBuffer and trying different encodings
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder('windows-1252'); // Common for French files
    return { content: decoder.decode(buffer), encoding: 'Windows-1252' };
  }
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

/**
 * Validate file type
 */
export function validateFileType(file: File): {
  isValid: boolean;
  fileType: 'csv' | 'xlsx' | 'xls' | null;
  error?: string;
} {
  const ext = getFileExtension(file.name);

  if (ext === 'csv') {
    return { isValid: true, fileType: 'csv' };
  }

  if (ext === 'xlsx') {
    return { isValid: true, fileType: 'xlsx' };
  }

  if (ext === 'xls') {
    return { isValid: true, fileType: 'xls' };
  }

  return {
    isValid: false,
    fileType: null,
    error: `Format de fichier non supporte: .${ext}. Utilisez CSV, XLSX ou XLS.`,
  };
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeBytes: number): {
  isValid: boolean;
  error?: string;
} {
  if (file.size > maxSizeBytes) {
    const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `Fichier trop volumineux (${fileSizeMB} MB). Maximum: ${maxSizeMB} MB.`,
    };
  }

  return { isValid: true };
}

