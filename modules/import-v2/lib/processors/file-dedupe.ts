/**
 * File Duplicate Detection for Import V2
 *
 * Detects duplicates within the import file itself.
 * Groups duplicate rows for user review and action.
 */

import type { LeadFieldKey } from '../../../import/types/mapping';
import type {
  RowValidationResultV2,
  FileDuplicateRowV2,
  FileDuplicateGroupV2,
} from '../../types';
import type { DuplicateCheckField } from '../../config/constants';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result of file duplicate detection
 */
export interface FileDuplicateResult {
  /** All rows including duplicate info */
  rows: RowWithFileDuplicateInfo[];
  /** Groups of duplicate rows */
  duplicateGroups: FileDuplicateGroupV2[];
  /** Total duplicate rows found */
  duplicateCount: number;
  /** Total unique duplicate groups */
  groupCount: number;
}

/**
 * Row with file duplicate information attached
 */
export interface RowWithFileDuplicateInfo {
  /** Original validation result */
  validation: RowValidationResultV2;
  /** Whether this row is a duplicate of another in the file */
  isFileDuplicate: boolean;
  /** Field that matched (if duplicate) */
  matchedField?: DuplicateCheckField;
  /** The matched value */
  matchedValue?: string;
  /** Group ID for this duplicate set */
  duplicateGroupId?: string;
  /** Whether this is the first occurrence (kept by default) */
  isFirstOccurrence: boolean;
}

// =============================================================================
// FILE DUPLICATE DETECTION
// =============================================================================

/**
 * Detect duplicates within a set of validated rows
 *
 * @param validatedRows - Array of validated rows
 * @param checkFields - Fields to check for duplicates
 * @returns File duplicate detection result
 *
 * @example
 * ```ts
 * const result = detectFileDuplicates(validatedRows, ['email', 'phone']);
 * console.log(`Found ${result.duplicateCount} duplicates in ${result.groupCount} groups`);
 * ```
 */
export function detectFileDuplicates(
  validatedRows: RowValidationResultV2[],
  checkFields: DuplicateCheckField[]
): FileDuplicateResult {
  // Map to track first occurrence: "field:value" -> rowNumber
  const firstOccurrenceMap = new Map<string, number>();

  // Map to track all occurrences: "field:value" -> rowNumbers[]
  const occurrencesMap = new Map<string, number[]>();

  // Map row number to duplicate info
  const rowDuplicateInfo = new Map<
    number,
    { field: DuplicateCheckField; value: string; groupKey: string }
  >();

  // First pass: build occurrence maps
  for (const row of validatedRows) {
    // Skip invalid rows - they won't be imported anyway
    if (!row.isValid) continue;

    for (const field of checkFields) {
      const value = row.normalizedData[field as LeadFieldKey];
      if (!value || typeof value !== 'string') continue;

      const normalizedValue = value.toLowerCase().trim();
      if (!normalizedValue) continue;

      const key = `${field}:${normalizedValue}`;

      if (!occurrencesMap.has(key)) {
        occurrencesMap.set(key, []);
        firstOccurrenceMap.set(key, row.rowNumber);
      }

      occurrencesMap.get(key)!.push(row.rowNumber);
    }
  }

  // Second pass: identify duplicates and create groups
  const duplicateGroups: FileDuplicateGroupV2[] = [];
  const processedRows = new Set<number>();

  for (const [key, rowNumbers] of occurrencesMap) {
    // Only process if there are actual duplicates (more than 1 occurrence)
    if (rowNumbers.length <= 1) continue;

    const [field, ...valueParts] = key.split(':');
    const value = valueParts.join(':'); // Handle values with colons

    // Create group ID
    const groupId = `file_dup_${field}_${rowNumbers[0]}`;

    // Mark all rows in this group
    for (const rowNum of rowNumbers) {
      if (!rowDuplicateInfo.has(rowNum)) {
        rowDuplicateInfo.set(rowNum, {
          field: field as DuplicateCheckField,
          value,
          groupKey: groupId,
        });
      }
    }

    // Build duplicate group with row details
    const groupRows: FileDuplicateRowV2[] = [];
    for (const rowNum of rowNumbers) {
      const validation = validatedRows.find((r) => r.rowNumber === rowNum);
      if (!validation) continue;

      const row: FileDuplicateRowV2 = {
        rowNumber: rowNum,
        issueType: 'file_duplicate',
        displayData: buildDisplayData(validation),
        validationResult: validation,
        matchedField: field as DuplicateCheckField,
        matchedValue: value,
        firstOccurrenceRow: rowNumbers[0],
        isFirstOccurrence: rowNum === rowNumbers[0],
      };
      groupRows.push(row);
    }

    if (groupRows.length > 1) {
      duplicateGroups.push({
        id: groupId,
        matchedField: field as DuplicateCheckField,
        matchedValue: value,
        rows: groupRows,
        count: groupRows.length,
      });
    }

    for (const rowNum of rowNumbers) {
      processedRows.add(rowNum);
    }
  }

  // Build result with all rows
  const rows: RowWithFileDuplicateInfo[] = validatedRows.map((validation) => {
    const duplicateInfo = rowDuplicateInfo.get(validation.rowNumber);
    const firstOccurrence = duplicateInfo
      ? firstOccurrenceMap.get(
          `${duplicateInfo.field}:${duplicateInfo.value}`
        ) === validation.rowNumber
      : true;

    return {
      validation,
      isFileDuplicate: !!duplicateInfo,
      matchedField: duplicateInfo?.field,
      matchedValue: duplicateInfo?.value,
      duplicateGroupId: duplicateInfo?.groupKey,
      isFirstOccurrence: firstOccurrence,
    };
  });

  // Count total duplicates (excluding first occurrences)
  const duplicateCount = rows.filter(
    (r) => r.isFileDuplicate && !r.isFirstOccurrence
  ).length;

  return {
    rows,
    duplicateGroups,
    duplicateCount,
    groupCount: duplicateGroups.length,
  };
}

// =============================================================================
// INTERNAL UTILITIES
// =============================================================================

/**
 * Build display data from a validation result
 */
function buildDisplayData(
  validation: RowValidationResultV2
): FileDuplicateRowV2['displayData'] {
  const data = validation.normalizedData;
  return {
    email: data.email,
    phone: data.phone,
    firstName: data.first_name,
    lastName: data.last_name,
    company: data.company,
    externalId: data.external_id,
  };
}
