/**
 * Import Parsers Module
 *
 * Provides streaming parsers for CSV and XLSX files.
 * Both parsers process files row-by-row for memory efficiency.
 */

import type { ColumnMapping } from '../../types';
import type { ParsedRow as ParsedRowType, ParseStats as ParseStatsType } from './csv-streamer';

// Re-export from csv-streamer
export {
  streamParseCSV,
  detectDelimiter,
  getCSVPreview,
} from './csv-streamer';

// Export types with explicit names
export type { CSVParseOptions, ParsedRow, ParseStats } from './csv-streamer';

// Re-export from xlsx-streamer
export {
  streamParseXLSX,
  getXLSXPreview,
  getXLSXSheetNames,
} from './xlsx-streamer';

export type { XLSXParseOptions } from './xlsx-streamer';

/**
 * Auto-detect file type and parse accordingly
 */
export async function streamParseFile(
  source: string | Blob | Buffer | ArrayBuffer,
  fileType: 'csv' | 'xlsx',
  options: {
    mappings: ColumnMapping[];
    startRow?: number;
    chunkSize?: number;
    sheetName?: string | number;
    onProgress?: (processed: number, valid: number, invalid: number) => void;
    onChunk: (rows: ParsedRowType[]) => Promise<void>;
    onComplete?: (stats: ParseStatsType) => void;
    onError?: (error: Error) => void;
  }
): Promise<ParseStatsType> {
  if (fileType === 'xlsx') {
    // Convert Blob to ArrayBuffer for XLSX
    let xlsxSource: string | Buffer | ArrayBuffer = source as string | Buffer | ArrayBuffer;
    if (source instanceof Blob) {
      xlsxSource = await source.arrayBuffer();
    }

    const { streamParseXLSX } = await import('./xlsx-streamer');
    return streamParseXLSX(xlsxSource, options);
  } else {
    const { streamParseCSV } = await import('./csv-streamer');
    return streamParseCSV(source as string | Blob, options);
  }
}
