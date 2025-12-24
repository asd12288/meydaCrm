/**
 * File Duplicate Detection Tests
 *
 * Tests for detecting duplicates within the import file
 */

import { describe, it, expect } from 'vitest';
import { detectFileDuplicates, getUniqueRows } from '../lib/processors/file-dedupe';
import type { RowValidationResultV2 } from '../types';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function createValidRow(
  rowNumber: number,
  data: { email?: string; phone?: string; external_id?: string }
): RowValidationResultV2 {
  return {
    rowNumber,
    isValid: true,
    errors: [],
    warnings: [],
    normalizedData: {
      email: data.email || null,
      phone: data.phone || null,
      external_id: data.external_id || null,
      first_name: 'Test',
      last_name: 'User',
    },
  };
}

function createInvalidRow(rowNumber: number): RowValidationResultV2 {
  return {
    rowNumber,
    isValid: false,
    errors: [{ field: 'email', message: 'Invalid email' }],
    warnings: [],
    normalizedData: {},
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe('detectFileDuplicates', () => {
  it('should detect no duplicates in unique rows', () => {
    const rows: RowValidationResultV2[] = [
      createValidRow(1, { email: 'jean@test.com' }),
      createValidRow(2, { email: 'marie@test.com' }),
      createValidRow(3, { email: 'pierre@test.com' }),
    ];

    const result = detectFileDuplicates(rows, ['email']);

    expect(result.duplicateCount).toBe(0);
    expect(result.groupCount).toBe(0);
    expect(result.duplicateGroups).toHaveLength(0);
  });

  it('should detect email duplicates', () => {
    const rows: RowValidationResultV2[] = [
      createValidRow(1, { email: 'jean@test.com' }),
      createValidRow(2, { email: 'marie@test.com' }),
      createValidRow(3, { email: 'jean@test.com' }), // Duplicate of row 1
    ];

    const result = detectFileDuplicates(rows, ['email']);

    expect(result.duplicateCount).toBe(1); // Only second occurrence counts
    expect(result.groupCount).toBe(1);
    expect(result.duplicateGroups).toHaveLength(1);
    expect(result.duplicateGroups[0].matchedField).toBe('email');
    expect(result.duplicateGroups[0].matchedValue).toBe('jean@test.com');
    expect(result.duplicateGroups[0].count).toBe(2);
  });

  // Note: Phone and external_id duplicate detection removed per user requirement
  // Only email is used for duplicate detection

  it('should handle multiple duplicate groups', () => {
    const rows: RowValidationResultV2[] = [
      createValidRow(1, { email: 'jean@test.com' }),
      createValidRow(2, { email: 'marie@test.com' }),
      createValidRow(3, { email: 'jean@test.com' }), // Dup of 1
      createValidRow(4, { email: 'marie@test.com' }), // Dup of 2
      createValidRow(5, { email: 'jean@test.com' }), // Dup of 1
    ];

    const result = detectFileDuplicates(rows, ['email']);

    expect(result.duplicateCount).toBe(3); // Rows 3, 4, 5 are duplicates
    expect(result.groupCount).toBe(2); // Two groups: jean, marie
  });

  it('should skip invalid rows', () => {
    const rows: RowValidationResultV2[] = [
      createValidRow(1, { email: 'jean@test.com' }),
      createInvalidRow(2), // Invalid - should be skipped
      createValidRow(3, { email: 'jean@test.com' }), // Duplicate
    ];

    const result = detectFileDuplicates(rows, ['email']);

    expect(result.duplicateCount).toBe(1);
    expect(result.groupCount).toBe(1);
    expect(result.duplicateGroups[0].rows).toHaveLength(2);
  });

  it('should mark first occurrence correctly', () => {
    const rows: RowValidationResultV2[] = [
      createValidRow(1, { email: 'jean@test.com' }),
      createValidRow(2, { email: 'jean@test.com' }),
      createValidRow(3, { email: 'jean@test.com' }),
    ];

    const result = detectFileDuplicates(rows, ['email']);

    expect(result.duplicateGroups[0].rows[0].isFirstOccurrence).toBe(true);
    expect(result.duplicateGroups[0].rows[1].isFirstOccurrence).toBe(false);
    expect(result.duplicateGroups[0].rows[2].isFirstOccurrence).toBe(false);
  });

  it('should detect duplicates with same email', () => {
    const rows: RowValidationResultV2[] = [
      createValidRow(1, { email: 'jean@test.com', phone: '+33612345678' }),
      createValidRow(2, { email: 'jean@test.com', phone: '+33698765432' }), // Same email, different phone
    ];

    const result = detectFileDuplicates(rows, ['email']);

    expect(result.duplicateCount).toBe(1);
    expect(result.duplicateGroups[0].matchedField).toBe('email');
  });

  it('should ignore empty fields', () => {
    const rows: RowValidationResultV2[] = [
      createValidRow(1, {}), // No email
      createValidRow(2, {}), // No email
    ];

    const result = detectFileDuplicates(rows, ['email']);

    expect(result.duplicateCount).toBe(0);
    expect(result.groupCount).toBe(0);
  });

  it('should handle case-insensitive matching', () => {
    const rows: RowValidationResultV2[] = [
      createValidRow(1, { email: 'Jean@Test.COM' }),
      createValidRow(2, { email: 'jean@test.com' }),
    ];

    const result = detectFileDuplicates(rows, ['email']);

    expect(result.duplicateCount).toBe(1);
    expect(result.duplicateGroups[0].matchedValue).toBe('jean@test.com');
  });
});

describe('getUniqueRows', () => {
  it('should return only first occurrences and non-duplicates', () => {
    const rows: RowValidationResultV2[] = [
      createValidRow(1, { email: 'jean@test.com' }),
      createValidRow(2, { email: 'marie@test.com' }),
      createValidRow(3, { email: 'jean@test.com' }), // Duplicate
    ];

    const result = detectFileDuplicates(rows, ['email']);
    const unique = getUniqueRows(result);

    expect(unique).toHaveLength(2);
    expect(unique[0].validation.rowNumber).toBe(1);
    expect(unique[1].validation.rowNumber).toBe(2);
  });
});
