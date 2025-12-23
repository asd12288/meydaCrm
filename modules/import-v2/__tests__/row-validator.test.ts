/**
 * Row Validator Tests for Import V2
 *
 * Tests for validation, normalization, and field transformation.
 */

import { describe, it, expect } from 'vitest';
import {
  normalizePhone,
  normalizeEmail,
  normalizePostalCode,
  normalizeText,
  capitalizeWords,
  tryFixEmailDomain,
  validateRow,
  applyMapping,
  normalizeRowData,
} from '../lib/validators/row-validator';
import type { ParsedRowV2, ColumnMappingV2 } from '../types';

// =============================================================================
// PHONE NORMALIZATION TESTS
// =============================================================================

describe('normalizePhone', () => {
  it('should normalize French mobile starting with 0', () => {
    expect(normalizePhone('0612345678')).toBe('+33612345678');
  });

  it('should normalize French number starting with 33', () => {
    expect(normalizePhone('33612345678')).toBe('+33612345678');
  });

  it('should handle spaces and dashes', () => {
    expect(normalizePhone('06 12 34 56 78')).toBe('+33612345678');
    expect(normalizePhone('06-12-34-56-78')).toBe('+33612345678');
  });

  it('should keep international format', () => {
    expect(normalizePhone('+33612345678')).toBe('+33612345678');
  });

  it('should add +33 to 9-digit numbers', () => {
    expect(normalizePhone('612345678')).toBe('+33612345678');
  });

  it('should remove common prefixes', () => {
    expect(normalizePhone('p:0612345678')).toBe('+33612345678');
    expect(normalizePhone('t:0612345678')).toBe('+33612345678');
  });

  it('should return null for null/undefined/empty', () => {
    expect(normalizePhone(null)).toBe(null);
    expect(normalizePhone(undefined)).toBe(null);
    expect(normalizePhone('')).toBe(null);
  });
});

// =============================================================================
// EMAIL NORMALIZATION TESTS
// =============================================================================

describe('normalizeEmail', () => {
  it('should lowercase and trim email', () => {
    expect(normalizeEmail(' Jean.Dupont@Gmail.COM ')).toBe('jean.dupont@gmail.com');
  });

  it('should return null for null/undefined/empty', () => {
    expect(normalizeEmail(null)).toBe(null);
    expect(normalizeEmail(undefined)).toBe(null);
    expect(normalizeEmail('')).toBe(null);
  });
});

describe('tryFixEmailDomain', () => {
  it('should fix missing dot in common domains', () => {
    expect(tryFixEmailDomain('test@gmailcom')).toEqual({
      email: 'test@gmail.com',
      wasFixed: true,
    });
    expect(tryFixEmailDomain('test@yahoofr')).toEqual({
      email: 'test@yahoo.fr',
      wasFixed: true,
    });
    expect(tryFixEmailDomain('test@hotmailcom')).toEqual({
      email: 'test@hotmail.com',
      wasFixed: true,
    });
  });

  it('should fix domain without dot using TLD detection', () => {
    expect(tryFixEmailDomain('test@testdomainecom')).toEqual({
      email: 'test@testdomaine.com',
      wasFixed: true,
    });
    expect(tryFixEmailDomain('test@monentreprisefr')).toEqual({
      email: 'test@monentreprise.fr',
      wasFixed: true,
    });
  });

  it('should not modify valid emails', () => {
    expect(tryFixEmailDomain('test@gmail.com')).toEqual({
      email: 'test@gmail.com',
      wasFixed: false,
    });
    expect(tryFixEmailDomain('test@custom-domain.fr')).toEqual({
      email: 'test@custom-domain.fr',
      wasFixed: false,
    });
  });

  it('should handle invalid emails gracefully', () => {
    expect(tryFixEmailDomain('invalid')).toEqual({
      email: 'invalid',
      wasFixed: false,
    });
    expect(tryFixEmailDomain('')).toEqual({
      email: '',
      wasFixed: false,
    });
  });
});

// =============================================================================
// POSTAL CODE NORMALIZATION TESTS
// =============================================================================

describe('normalizePostalCode', () => {
  it('should pad 4-digit French codes with leading zero', () => {
    expect(normalizePostalCode('1000')).toBe('01000');
    expect(normalizePostalCode('9999')).toBe('09999');
  });

  it('should keep 5-digit codes as-is', () => {
    expect(normalizePostalCode('75001')).toBe('75001');
    expect(normalizePostalCode('13001')).toBe('13001');
  });

  it('should remove spaces', () => {
    expect(normalizePostalCode('75 001')).toBe('75001');
    expect(normalizePostalCode(' 1000 ')).toBe('01000');
  });

  it('should return null for null/undefined/empty', () => {
    expect(normalizePostalCode(null)).toBe(null);
    expect(normalizePostalCode(undefined)).toBe(null);
    expect(normalizePostalCode('')).toBe(null);
  });
});

// =============================================================================
// TEXT NORMALIZATION TESTS
// =============================================================================

describe('normalizeText', () => {
  it('should trim and collapse whitespace', () => {
    expect(normalizeText('  hello   world  ')).toBe('hello world');
  });

  it('should return null for null/undefined/empty', () => {
    expect(normalizeText(null)).toBe(null);
    expect(normalizeText(undefined)).toBe(null);
    expect(normalizeText('   ')).toBe(null);
  });
});

describe('capitalizeWords', () => {
  it('should capitalize first letter of each word', () => {
    expect(capitalizeWords('jean-pierre dupont')).toBe('Jean-Pierre Dupont');
    expect(capitalizeWords('MARIE MARTIN')).toBe('Marie Martin');
  });

  it('should return null for null/undefined/empty', () => {
    expect(capitalizeWords(null)).toBe(null);
    expect(capitalizeWords(undefined)).toBe(null);
  });
});

// =============================================================================
// APPLY MAPPING TESTS
// =============================================================================

describe('applyMapping', () => {
  it('should map columns to fields correctly', () => {
    const row: ParsedRowV2 = {
      rowNumber: 1,
      values: ['Jean', 'Dupont', 'jean@test.com', '0612345678'],
    };

    const mappings: ColumnMappingV2[] = [
      { sourceColumn: 'Prenom', sourceIndex: 0, targetField: 'first_name', confidence: 1, isManual: false, sampleValues: [] },
      { sourceColumn: 'Nom', sourceIndex: 1, targetField: 'last_name', confidence: 1, isManual: false, sampleValues: [] },
      { sourceColumn: 'Email', sourceIndex: 2, targetField: 'email', confidence: 1, isManual: false, sampleValues: [] },
      { sourceColumn: 'Tel', sourceIndex: 3, targetField: 'phone', confidence: 1, isManual: false, sampleValues: [] },
    ];

    const result = applyMapping(row, mappings);

    expect(result.first_name).toBe('Jean');
    expect(result.last_name).toBe('Dupont');
    expect(result.email).toBe('jean@test.com');
    expect(result.phone).toBe('0612345678');
  });

  it('should skip unmapped columns', () => {
    const row: ParsedRowV2 = {
      rowNumber: 1,
      values: ['Jean', 'Some extra data'],
    };

    const mappings: ColumnMappingV2[] = [
      { sourceColumn: 'Prenom', sourceIndex: 0, targetField: 'first_name', confidence: 1, isManual: false, sampleValues: [] },
      { sourceColumn: 'Extra', sourceIndex: 1, targetField: null, confidence: 0, isManual: false, sampleValues: [] },
    ];

    const result = applyMapping(row, mappings);

    expect(result.first_name).toBe('Jean');
    expect(Object.keys(result)).toHaveLength(1);
  });

  it('should handle empty values', () => {
    const row: ParsedRowV2 = {
      rowNumber: 1,
      values: ['', '  ', 'valid@email.com'],
    };

    const mappings: ColumnMappingV2[] = [
      { sourceColumn: 'Prenom', sourceIndex: 0, targetField: 'first_name', confidence: 1, isManual: false, sampleValues: [] },
      { sourceColumn: 'Nom', sourceIndex: 1, targetField: 'last_name', confidence: 1, isManual: false, sampleValues: [] },
      { sourceColumn: 'Email', sourceIndex: 2, targetField: 'email', confidence: 1, isManual: false, sampleValues: [] },
    ];

    const result = applyMapping(row, mappings);

    // Empty values should not be included
    expect(result.first_name).toBeUndefined();
    expect(result.last_name).toBeUndefined();
    expect(result.email).toBe('valid@email.com');
  });
});

// =============================================================================
// NORMALIZE ROW DATA TESTS
// =============================================================================

describe('normalizeRowData', () => {
  it('should normalize all fields correctly', () => {
    const data = {
      first_name: 'jean-pierre',
      last_name: 'DUPONT',
      email: '  Jean@GmailCom  ',
      phone: '0612345678',
      postal_code: '1000',
      company: 'acme corp',
    };

    const result = normalizeRowData(data);

    expect(result.first_name).toBe('Jean-Pierre');
    expect(result.last_name).toBe('Dupont');
    expect(result.email).toBe('jean@gmail.com');
    expect(result.phone).toBe('+33612345678');
    expect(result.postal_code).toBe('01000');
    expect(result.company).toBe('Acme Corp');
    expect(result.country).toBe('France'); // Default
  });
});

// =============================================================================
// VALIDATE ROW TESTS
// =============================================================================

describe('validateRow', () => {
  const createMappings = (): ColumnMappingV2[] => [
    { sourceColumn: 'Prenom', sourceIndex: 0, targetField: 'first_name', confidence: 1, isManual: false, sampleValues: [] },
    { sourceColumn: 'Nom', sourceIndex: 1, targetField: 'last_name', confidence: 1, isManual: false, sampleValues: [] },
    { sourceColumn: 'Email', sourceIndex: 2, targetField: 'email', confidence: 1, isManual: false, sampleValues: [] },
    { sourceColumn: 'Tel', sourceIndex: 3, targetField: 'phone', confidence: 1, isManual: false, sampleValues: [] },
    { sourceColumn: 'Entreprise', sourceIndex: 4, targetField: 'company', confidence: 1, isManual: false, sampleValues: [] },
  ];

  it('should validate a complete valid row', () => {
    const row: ParsedRowV2 = {
      rowNumber: 1,
      values: ['Jean', 'Dupont', 'jean@gmail.com', '0612345678', 'ACME'],
    };

    const result = validateRow(row, createMappings());

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.normalizedData.first_name).toBe('Jean');
    expect(result.normalizedData.email).toBe('jean@gmail.com');
    expect(result.normalizedData.phone).toBe('+33612345678');
  });

  it('should fail if no contact info is provided', () => {
    const row: ParsedRowV2 = {
      rowNumber: 1,
      values: ['Jean', 'Dupont', '', '', 'ACME'],
    };

    const result = validateRow(row, createMappings());

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('contact'))).toBe(true);
  });

  it('should allow row with only email', () => {
    const row: ParsedRowV2 = {
      rowNumber: 1,
      values: ['', '', 'test@example.com', '', ''],
    };

    const result = validateRow(row, createMappings());

    expect(result.isValid).toBe(true);
  });

  it('should allow row with only phone', () => {
    const row: ParsedRowV2 = {
      rowNumber: 1,
      values: ['', '', '', '0612345678', ''],
    };

    const result = validateRow(row, createMappings());

    expect(result.isValid).toBe(true);
  });

  it('should fail for invalid email format', () => {
    const row: ParsedRowV2 = {
      rowNumber: 1,
      values: ['Jean', 'Dupont', 'not-an-email', '', 'ACME'],
    };

    const result = validateRow(row, createMappings());

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.field === 'email')).toBe(true);
  });

  it('should warn for too short phone', () => {
    const row: ParsedRowV2 = {
      rowNumber: 1,
      values: ['Jean', 'Dupont', 'test@example.com', '12345', 'ACME'],
    };

    const result = validateRow(row, createMappings());

    // Short phone should be an error
    expect(result.errors.some((e) => e.field === 'phone')).toBe(true);
  });

  it('should warn for missing name', () => {
    const row: ParsedRowV2 = {
      rowNumber: 1,
      values: ['', '', 'test@example.com', '', 'ACME'],
    };

    const result = validateRow(row, createMappings());

    expect(result.isValid).toBe(true); // Valid but has warning
    expect(result.warnings.some((w) => w.message.includes('nom'))).toBe(true);
  });

  it('should warn for missing company', () => {
    const row: ParsedRowV2 = {
      rowNumber: 1,
      values: ['Jean', 'Dupont', 'test@example.com', '', ''],
    };

    const result = validateRow(row, createMappings());

    expect(result.isValid).toBe(true);
    expect(result.warnings.some((w) => w.field === 'company')).toBe(true);
  });

  it('should add warning when email was auto-fixed', () => {
    const row: ParsedRowV2 = {
      rowNumber: 1,
      values: ['Jean', 'Dupont', 'test@gmailcom', '', 'ACME'],
    };

    const result = validateRow(row, createMappings());

    expect(result.isValid).toBe(true);
    expect(result.warnings.some((w) => w.field === 'email' && w.message.includes('corrige'))).toBe(true);
    expect(result.normalizedData.email).toBe('test@gmail.com');
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Edge cases', () => {
  it('should handle row with all empty values', () => {
    const row: ParsedRowV2 = {
      rowNumber: 1,
      values: ['', '', '', '', ''],
    };

    const mappings: ColumnMappingV2[] = [
      { sourceColumn: 'Email', sourceIndex: 0, targetField: 'email', confidence: 1, isManual: false, sampleValues: [] },
    ];

    const result = validateRow(row, mappings);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should handle special characters in names', () => {
    const row: ParsedRowV2 = {
      rowNumber: 1,
      values: ['Jean-François', "O'Brien", 'test@example.com', '', ''],
    };

    const mappings: ColumnMappingV2[] = [
      { sourceColumn: 'Prenom', sourceIndex: 0, targetField: 'first_name', confidence: 1, isManual: false, sampleValues: [] },
      { sourceColumn: 'Nom', sourceIndex: 1, targetField: 'last_name', confidence: 1, isManual: false, sampleValues: [] },
      { sourceColumn: 'Email', sourceIndex: 2, targetField: 'email', confidence: 1, isManual: false, sampleValues: [] },
    ];

    const result = validateRow(row, mappings);

    expect(result.isValid).toBe(true);
    expect(result.normalizedData.first_name).toBe('Jean-François');
    expect(result.normalizedData.last_name).toBe("O'brien");
  });

  it('should handle very long values', () => {
    const longEmail = 'a'.repeat(300) + '@test.com';
    const row: ParsedRowV2 = {
      rowNumber: 1,
      values: ['Jean', 'Dupont', longEmail, '', ''],
    };

    const mappings: ColumnMappingV2[] = [
      { sourceColumn: 'Email', sourceIndex: 2, targetField: 'email', confidence: 1, isManual: false, sampleValues: [] },
    ];

    const result = validateRow(row, mappings);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.field === 'email' && e.message.includes('trop long'))).toBe(true);
  });
});
