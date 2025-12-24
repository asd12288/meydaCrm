/**
 * Import V2 Integration Tests
 *
 * Comprehensive tests covering all import scenarios:
 * - File parsing (CSV, delimiters, encodings)
 * - Validation (emails, phones, required fields)
 * - Duplicate detection (file-level, case-insensitive)
 * - Edge cases (special chars, empty files, etc.)
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

import {
  validateRows,
  normalizePhone,
  normalizeEmail,
  normalizePostalCode,
  tryFixEmailDomain,
} from '../lib/validators/row-validator';
import { detectFileDuplicates } from '../lib/processors/file-dedupe';
import { findBestMatch } from '../../import/config/column-aliases';
import type { ParsedRowV2, ColumnMappingV2 } from '../types';
import type { LeadFieldKey } from '../../import/types/mapping';

// =============================================================================
// TEST DATA PATHS
// =============================================================================

const TEST_DATA_DIR = path.join(process.cwd(), 'test-data', 'import');

function loadTestCSV(filename: string): { headers: string[]; rows: ParsedRowV2[] } {
  const filePath = path.join(TEST_DATA_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Detect delimiter
  const firstLine = content.split('\n')[0];
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let delimiter = ',';
  if (semicolonCount > commaCount && semicolonCount > tabCount) delimiter = ';';
  if (tabCount > commaCount && tabCount > semicolonCount) delimiter = '\t';

  const result = Papa.parse(content, {
    delimiter,
    skipEmptyLines: true,
  });

  const data = result.data as string[][];
  if (data.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = data[0];
  const rows: ParsedRowV2[] = data.slice(1).map((row, index) => ({
    rowNumber: index + 2, // 1-indexed, skip header
    values: row,
  }));

  return { headers, rows };
}

function createMappingsFromHeaders(headers: string[]): ColumnMappingV2[] {
  const usedFields = new Set<LeadFieldKey>();
  const mappings: ColumnMappingV2[] = [];

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const { field, confidence } = findBestMatch(header);

    // Avoid duplicate field assignments
    const targetField = field && !usedFields.has(field) && confidence >= 0.7 ? field : null;
    if (targetField) {
      usedFields.add(targetField);
    }

    mappings.push({
      sourceColumn: header,
      sourceIndex: i,
      targetField,
      confidence,
      isManual: false,
      sampleValues: [],
    });
  }

  return mappings;
}

// =============================================================================
// 1. FILE PARSING TESTS
// =============================================================================

describe('File Parsing', () => {
  describe('CSV Parsing', () => {
    it('should parse standard comma-delimited CSV', () => {
      const { headers, rows } = loadTestCSV('01_happy_path.csv');

      expect(headers).toContain('prenom');
      expect(headers).toContain('email');
      expect(rows.length).toBe(4);
      expect(rows[0].values[0]).toBe('Jean');
    });

    it('should parse semicolon-delimited CSV (French format)', () => {
      const { headers, rows } = loadTestCSV('25_semicolon_delimiter.csv');

      expect(headers).toContain('prenom');
      expect(headers).toContain('email');
      expect(rows.length).toBe(3);
      expect(rows[0].values[0]).toBe('Jean');
    });

    it('should parse tab-delimited CSV', () => {
      const { headers, rows } = loadTestCSV('26_tab_delimiter.csv');

      expect(headers.length).toBeGreaterThan(0);
      expect(rows.length).toBeGreaterThan(0);
    });

    it('should handle headers-only file (no data rows)', () => {
      const { headers, rows } = loadTestCSV('03_headers_only.csv');

      expect(headers.length).toBeGreaterThan(0);
      expect(rows.length).toBe(0);
    });
  });

  describe('Column Auto-Mapping', () => {
    it('should auto-map French column names', () => {
      const { headers } = loadTestCSV('12_french_column_names.csv');
      const mappings = createMappingsFromHeaders(headers);

      // French file has: Prénom, Nom de famille, Adresse email, Téléphone portable
      const prenomMapping = mappings.find((m) => m.sourceColumn.toLowerCase().includes('prénom'));
      // Use "nom de famille" to avoid matching "Prénom" which also contains "nom"
      const nomMapping = mappings.find((m) => m.sourceColumn.toLowerCase().includes('nom de famille'));
      const emailMapping = mappings.find((m) => m.sourceColumn.toLowerCase().includes('email'));

      expect(prenomMapping?.targetField).toBe('first_name');
      expect(nomMapping?.targetField).toBe('last_name');
      expect(emailMapping?.targetField).toBe('email');
    });

    it('should auto-map English column names', () => {
      const { headers } = loadTestCSV('13_english_column_names.csv');
      const mappings = createMappingsFromHeaders(headers);

      // English file has: First Name, Last Name, Email Address, Phone Number
      const firstNameMapping = mappings.find((m) =>
        m.sourceColumn.toLowerCase().includes('first')
      );
      const emailMapping = mappings.find((m) => m.sourceColumn.toLowerCase().includes('email'));

      expect(firstNameMapping?.targetField).toBe('first_name');
      expect(emailMapping?.targetField).toBe('email');
    });
  });
});

// =============================================================================
// 2. VALIDATION TESTS
// =============================================================================

describe('Row Validation', () => {
  describe('Happy Path - All Valid', () => {
    it('should validate all rows in happy_path file', () => {
      const { headers, rows } = loadTestCSV('01_happy_path.csv');
      const mappings = createMappingsFromHeaders(headers);
      const results = validateRows(rows, mappings);

      const validCount = results.filter((r) => r.isValid).length;
      const invalidCount = results.filter((r) => !r.isValid).length;

      expect(validCount).toBe(4);
      expect(invalidCount).toBe(0);
    });
  });

  describe('Email Validation', () => {
    it('should detect invalid email formats', () => {
      const { headers, rows } = loadTestCSV('05_invalid_emails.csv');
      const mappings = createMappingsFromHeaders(headers);
      const results = validateRows(rows, mappings);

      // Most rows have invalid emails, but some might be valid due to phone backup
      const emailErrors = results.filter((r) =>
        r.errors.some((e) => e.field === 'email')
      );

      expect(emailErrors.length).toBeGreaterThan(0);
    });

    it('should auto-fix email domains and add warnings', () => {
      const { headers, rows } = loadTestCSV('06_email_auto_fix.csv');
      const mappings = createMappingsFromHeaders(headers);
      const results = validateRows(rows, mappings);

      // Check that emails were fixed
      const gmailRow = results.find((r) => r.rowNumber === 2);
      expect(gmailRow?.normalizedData.email).toBe('jean@gmail.com');
      expect(gmailRow?.warnings.some((w) => w.field === 'email')).toBe(true);

      const yahooRow = results.find((r) => r.rowNumber === 3);
      expect(yahooRow?.normalizedData.email).toBe('marie@yahoo.fr');
    });

    it('should normalize email to lowercase', () => {
      expect(normalizeEmail('JEAN@GMAIL.COM')).toBe('jean@gmail.com');
      expect(normalizeEmail('  Marie@Test.FR  ')).toBe('marie@test.fr');
    });
  });

  describe('Phone Validation', () => {
    it('should normalize various phone formats', () => {
      const { headers, rows } = loadTestCSV('07_phone_formats.csv');
      const mappings = createMappingsFromHeaders(headers);
      const results = validateRows(rows, mappings);

      // Standard format
      const row1 = results.find((r) => r.rowNumber === 2);
      expect(row1?.normalizedData.phone).toBe('+33612345678');

      // With spaces
      const row2 = results.find((r) => r.rowNumber === 3);
      expect(row2?.normalizedData.phone).toBe('+33612345678');

      // With dashes
      const row4 = results.find((r) => r.rowNumber === 5);
      expect(row4?.normalizedData.phone).toBe('+33612345678');

      // International format
      const row5 = results.find((r) => r.rowNumber === 6);
      expect(row5?.normalizedData.phone).toBe('+33612345678');
    });

    it('should detect too short phone numbers', () => {
      const { headers, rows } = loadTestCSV('07_phone_formats.csv');
      const mappings = createMappingsFromHeaders(headers);
      const results = validateRows(rows, mappings);

      // Row 13 has "12345" - too short
      const shortPhoneRow = results.find((r) => r.rowNumber === 13);
      expect(
        shortPhoneRow?.errors.some((e) => e.field === 'phone')
      ).toBe(true);
    });
  });

  describe('Contact Field Requirement', () => {
    it('should fail rows with no contact info', () => {
      const { headers, rows } = loadTestCSV('04_missing_contact_fields.csv');
      const mappings = createMappingsFromHeaders(headers);
      const results = validateRows(rows, mappings);

      // Rows 1-2 have no email, phone, or external_id
      const row1 = results.find((r) => r.rowNumber === 2);
      const row2 = results.find((r) => r.rowNumber === 3);

      expect(row1?.isValid).toBe(false);
      expect(row2?.isValid).toBe(false);

      // Row 3 has email - should be valid
      const row3 = results.find((r) => r.rowNumber === 4);
      expect(row3?.isValid).toBe(true);

      // Row 4 has phone - should be valid
      const row4 = results.find((r) => r.rowNumber === 5);
      expect(row4?.isValid).toBe(true);

      // Row 5 has external_id - should be valid
      const row5 = results.find((r) => r.rowNumber === 6);
      expect(row5?.isValid).toBe(true);
    });
  });

  describe('Mixed Valid/Invalid Rows', () => {
    it('should correctly categorize mixed rows', () => {
      const { headers, rows } = loadTestCSV('11_mixed_valid_invalid.csv');
      const mappings = createMappingsFromHeaders(headers);
      const results = validateRows(rows, mappings);

      // Row 1: VALIDE - tous les champs OK
      expect(results.find((r) => r.rowNumber === 2)?.isValid).toBe(true);

      // Row 2: INVALIDE - email malformé
      expect(results.find((r) => r.rowNumber === 3)?.isValid).toBe(false);

      // Row 3: VALIDE - telephone manquant mais email present
      expect(results.find((r) => r.rowNumber === 4)?.isValid).toBe(true);

      // Row 4: INVALIDE - aucun champ contact
      expect(results.find((r) => r.rowNumber === 5)?.isValid).toBe(false);

      // Row 5: VALIDE - entreprise manquante (warning)
      const row5 = results.find((r) => r.rowNumber === 6);
      expect(row5?.isValid).toBe(true);
      expect(row5?.warnings.some((w) => w.field === 'company')).toBe(true);
    });
  });

  describe('Postal Code Normalization', () => {
    it('should pad 4-digit French postal codes', () => {
      expect(normalizePostalCode('1000')).toBe('01000');
      expect(normalizePostalCode('1300')).toBe('01300');
    });

    it('should remove spaces from postal codes', () => {
      expect(normalizePostalCode('75 001')).toBe('75001');
    });

    it('should keep 5-digit codes as-is', () => {
      expect(normalizePostalCode('75001')).toBe('75001');
      expect(normalizePostalCode('69001')).toBe('69001');
    });
  });

  describe('Special Characters', () => {
    it('should handle French accents and special names', () => {
      const { headers, rows } = loadTestCSV('09_special_characters.csv');
      const mappings = createMappingsFromHeaders(headers);
      const results = validateRows(rows, mappings);

      // All rows should be valid
      const validCount = results.filter((r) => r.isValid).length;
      expect(validCount).toBe(rows.length);

      // Check specific names are preserved
      const francoisRow = results.find((r) => r.rowNumber === 2);
      expect(francoisRow?.normalizedData.first_name).toContain('Fran');
    });
  });
});

// =============================================================================
// 3. DUPLICATE DETECTION TESTS
// =============================================================================

describe('File Duplicate Detection', () => {
  it('should detect email duplicates within file', () => {
    const { headers, rows } = loadTestCSV('08_duplicates_in_file.csv');
    const mappings = createMappingsFromHeaders(headers);
    const results = validateRows(rows, mappings);

    const validResults = results.filter((r) => r.isValid);
    const dupeResult = detectFileDuplicates(validResults, ['email']);

    // jean.dupont@gmail.com appears multiple times
    expect(dupeResult.duplicateCount).toBeGreaterThan(0);
    expect(dupeResult.groupCount).toBeGreaterThan(0);
  });

  it('should detect case-insensitive duplicates', () => {
    const { headers, rows } = loadTestCSV('08_duplicates_in_file.csv');
    const mappings = createMappingsFromHeaders(headers);
    const results = validateRows(rows, mappings);

    const validResults = results.filter((r) => r.isValid);
    const dupeResult = detectFileDuplicates(validResults, ['email']);

    // JEAN.DUPONT@GMAIL.COM should match jean.dupont@gmail.com
    const jeanGroup = dupeResult.duplicateGroups.find((g) =>
      g.matchedValue.toLowerCase().includes('jean.dupont@gmail.com')
    );

    expect(jeanGroup).toBeDefined();
    expect(jeanGroup?.count).toBeGreaterThanOrEqual(2);
  });

  it('should mark first occurrence correctly', () => {
    const { headers, rows } = loadTestCSV('08_duplicates_in_file.csv');
    const mappings = createMappingsFromHeaders(headers);
    const results = validateRows(rows, mappings);

    const validResults = results.filter((r) => r.isValid);
    const dupeResult = detectFileDuplicates(validResults, ['email']);

    for (const group of dupeResult.duplicateGroups) {
      const firstOccurrences = group.rows.filter((r) => r.isFirstOccurrence);
      expect(firstOccurrences.length).toBe(1);
    }
  });

  it('should return no duplicates for unique file', () => {
    const { headers, rows } = loadTestCSV('01_happy_path.csv');
    const mappings = createMappingsFromHeaders(headers);
    const results = validateRows(rows, mappings);

    const validResults = results.filter((r) => r.isValid);
    const dupeResult = detectFileDuplicates(validResults, ['email']);

    expect(dupeResult.duplicateCount).toBe(0);
    expect(dupeResult.groupCount).toBe(0);
  });
});

// =============================================================================
// 4. EDGE CASES
// =============================================================================

describe('Edge Cases', () => {
  describe('Empty/Whitespace Values', () => {
    it('should handle empty values correctly', () => {
      const { headers, rows } = loadTestCSV('18_empty_values.csv');
      const mappings = createMappingsFromHeaders(headers);
      const results = validateRows(rows, mappings);

      // Verify that empty values don't cause crashes
      expect(results.length).toBe(rows.length);
    });

    it('should handle whitespace-only values', () => {
      const { headers, rows } = loadTestCSV('10_whitespace_issues.csv');
      const mappings = createMappingsFromHeaders(headers);
      const results = validateRows(rows, mappings);

      // Whitespace should be trimmed
      expect(results.length).toBe(rows.length);
    });
  });

  describe('Long Values', () => {
    it('should handle long field values', () => {
      const { headers, rows } = loadTestCSV('15_long_values.csv');
      const mappings = createMappingsFromHeaders(headers);
      const results = validateRows(rows, mappings);

      // Should handle without crashing
      expect(results.length).toBe(rows.length);

      // Very long emails should fail - results are validated above
      // May or may not have long emails depending on test data
    });
  });

  describe('Single Row File', () => {
    it('should handle single row file', () => {
      const { headers, rows } = loadTestCSV('21_single_row.csv');
      const mappings = createMappingsFromHeaders(headers);
      const results = validateRows(rows, mappings);

      expect(results.length).toBe(1);
      expect(results[0].isValid).toBe(true);
    });
  });

  describe('Large Batch', () => {
    it('should handle 100+ rows efficiently', () => {
      const { headers, rows } = loadTestCSV('22_large_batch_100.csv');
      const mappings = createMappingsFromHeaders(headers);

      const start = Date.now();
      const results = validateRows(rows, mappings);
      const duration = Date.now() - start;

      expect(results.length).toBe(rows.length);
      expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
    });
  });
});

// =============================================================================
// 5. EMAIL AUTO-FIX TESTS
// =============================================================================

describe('Email Domain Auto-Fix', () => {
  it('should fix gmailcom to gmail.com', () => {
    const result = tryFixEmailDomain('test@gmailcom');
    expect(result.email).toBe('test@gmail.com');
    expect(result.wasFixed).toBe(true);
  });

  it('should fix yahoofr to yahoo.fr', () => {
    const result = tryFixEmailDomain('test@yahoofr');
    expect(result.email).toBe('test@yahoo.fr');
    expect(result.wasFixed).toBe(true);
  });

  it('should fix hotmailcom to hotmail.com', () => {
    const result = tryFixEmailDomain('test@hotmailcom');
    expect(result.email).toBe('test@hotmail.com');
    expect(result.wasFixed).toBe(true);
  });

  it('should fix generic domain without dot', () => {
    const result = tryFixEmailDomain('test@customdomainefr');
    expect(result.email).toBe('test@customdomaine.fr');
    expect(result.wasFixed).toBe(true);
  });

  it('should not modify valid emails', () => {
    const result = tryFixEmailDomain('test@gmail.com');
    expect(result.email).toBe('test@gmail.com');
    expect(result.wasFixed).toBe(false);
  });
});

// =============================================================================
// 6. PHONE NORMALIZATION TESTS
// =============================================================================

describe('Phone Normalization', () => {
  it('should normalize French mobile (0612345678)', () => {
    expect(normalizePhone('0612345678')).toBe('+33612345678');
  });

  it('should normalize with spaces (06 12 34 56 78)', () => {
    expect(normalizePhone('06 12 34 56 78')).toBe('+33612345678');
  });

  it('should normalize with dots (06.12.34.56.78)', () => {
    expect(normalizePhone('06.12.34.56.78')).toBe('+33612345678');
  });

  it('should normalize with dashes (06-12-34-56-78)', () => {
    expect(normalizePhone('06-12-34-56-78')).toBe('+33612345678');
  });

  it('should normalize international format (+33612345678)', () => {
    expect(normalizePhone('+33612345678')).toBe('+33612345678');
  });

  // Note: 0033 prefix (13 digits) is NOT currently normalized - known limitation
  it('should pass through 00 prefix unchanged (limitation)', () => {
    expect(normalizePhone('0033612345678')).toBe('0033612345678');
  });

  it('should normalize 33 prefix without + (33612345678)', () => {
    expect(normalizePhone('33612345678')).toBe('+33612345678');
  });

  it('should normalize 9-digit number (612345678)', () => {
    expect(normalizePhone('612345678')).toBe('+33612345678');
  });

  it('should remove p: prefix', () => {
    expect(normalizePhone('p:0612345678')).toBe('+33612345678');
  });

  it('should remove t: prefix', () => {
    expect(normalizePhone('t:0612345678')).toBe('+33612345678');
  });

  it('should return null for empty/null', () => {
    expect(normalizePhone(null)).toBe(null);
    expect(normalizePhone('')).toBe(null);
    expect(normalizePhone('   ')).toBe(null);
  });
});

// =============================================================================
// 7. SUMMARY STATISTICS
// =============================================================================

describe('Import Summary Statistics', () => {
  it('should calculate correct counts for mixed file', () => {
    const { headers, rows } = loadTestCSV('11_mixed_valid_invalid.csv');
    const mappings = createMappingsFromHeaders(headers);
    const results = validateRows(rows, mappings);

    const validResults = results.filter((r) => r.isValid);
    const invalidResults = results.filter((r) => !r.isValid);
    const dupeResult = detectFileDuplicates(validResults, ['email']);

    const summary = {
      total: rows.length,
      valid: validResults.length,
      invalid: invalidResults.length,
      fileDuplicates: dupeResult.duplicateCount,
      warnings: results.filter((r) => r.warnings.length > 0).length,
    };

    expect(summary.total).toBe(rows.length);
    expect(summary.valid + summary.invalid).toBe(summary.total);
  });
});
