/**
 * Database Duplicate Detection for Import V2
 *
 * Server-side duplicate detection against existing leads.
 * Fetches existing lead data for side-by-side comparison.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { LeadFieldKey } from '../../../import/types/mapping';
import type { RowValidationResultV2 } from '../../types';
import type {
  DbDuplicateRowV2,
  ExistingLeadDataV2,
} from '../../types/preview';
import type { DuplicateCheckField, UnifiedRowAction } from '../../config/constants';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result of database duplicate detection
 */
export interface DbDuplicateResult {
  /** All rows with duplicate info attached */
  rows: RowWithDbDuplicateInfo[];
  /** Rows that are duplicates of existing leads */
  duplicateRows: DbDuplicateRowV2[];
  /** Total count of DB duplicates */
  duplicateCount: number;
}

/**
 * Row with database duplicate information
 */
export interface RowWithDbDuplicateInfo {
  /** Original validation result */
  validation: RowValidationResultV2;
  /** Whether this row is a duplicate of an existing lead */
  isDbDuplicate: boolean;
  /** Field that matched (if duplicate) */
  matchedField?: DuplicateCheckField;
  /** Matched value */
  matchedValue?: string;
  /** Existing lead ID (if duplicate) */
  existingLeadId?: string;
  /** Existing lead data (if duplicate) */
  existingLead?: ExistingLeadDataV2;
  /** Fields that changed */
  changedFields?: LeadFieldKey[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const BATCH_SIZE = 100; // Rows per query batch

// Fields to compare for change detection
const COMPARABLE_FIELDS: LeadFieldKey[] = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'company',
  'job_title',
  'address',
  'city',
  'postal_code',
  'country',
  'source',
  'notes',
  'external_id',
];

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Detect database duplicates for validated rows
 *
 * @param supabase - Supabase admin client
 * @param validatedRows - Validated rows from file
 * @param checkFields - Fields to check for duplicates
 * @returns Database duplicate detection result
 */
export async function detectDbDuplicates(
  supabase: SupabaseClient,
  validatedRows: RowValidationResultV2[],
  checkFields: DuplicateCheckField[]
): Promise<DbDuplicateResult> {
  // Only check valid rows
  const validRows = validatedRows.filter((r) => r.isValid);

  // Build O(1) lookup map for valid rows by row number (fixes N+1 query pattern)
  const validRowsByNumber = new Map<number, RowValidationResultV2>();
  for (const row of validRows) {
    validRowsByNumber.set(row.rowNumber, row);
  }

  // Build lookup maps for each field
  const lookupMaps = new Map<DuplicateCheckField, Map<string, number[]>>();

  for (const field of checkFields) {
    const fieldMap = new Map<string, number[]>();
    for (const row of validRows) {
      const value = row.normalizedData[field as LeadFieldKey];
      if (!value || typeof value !== 'string') continue;

      const normalizedValue = value.toLowerCase().trim();
      if (!normalizedValue) continue;

      if (!fieldMap.has(normalizedValue)) {
        fieldMap.set(normalizedValue, []);
      }
      fieldMap.get(normalizedValue)!.push(row.rowNumber);
    }
    lookupMaps.set(field, fieldMap);
  }

  // Query database for each field
  const rowDuplicateInfo = new Map<number, RowWithDbDuplicateInfo>();
  const duplicateRows: DbDuplicateRowV2[] = [];

  for (const field of checkFields) {
    const fieldMap = lookupMaps.get(field)!;
    const values = Array.from(fieldMap.keys());

    if (values.length === 0) continue;

    // Query in batches
    for (let i = 0; i < values.length; i += BATCH_SIZE) {
      const batch = values.slice(i, i + BATCH_SIZE);

      const { data: existingLeads } = await supabase
        .from('leads')
        .select(`
          id,
          email,
          phone,
          first_name,
          last_name,
          company,
          job_title,
          address,
          city,
          postal_code,
          country,
          status,
          source,
          notes,
          external_id,
          assigned_to,
          created_at,
          updated_at
        `)
        .in(field, batch)
        .is('deleted_at', null);

      if (!existingLeads || existingLeads.length === 0) continue;

      // Match existing leads to import rows
      for (const existingLead of existingLeads) {
        const fieldValue = (existingLead as Record<string, unknown>)[field] as string | null;
        if (!fieldValue) continue;

        const normalizedValue = fieldValue.toLowerCase().trim();
        const matchingRowNumbers = fieldMap.get(normalizedValue);

        if (!matchingRowNumbers) continue;

        for (const rowNumber of matchingRowNumbers) {
          // Skip if already matched (by a higher-priority field)
          if (rowDuplicateInfo.has(rowNumber)) continue;

          const validation = validRowsByNumber.get(rowNumber);
          if (!validation) continue;

          const existingLeadData = mapLeadToExistingData(existingLead);
          const changedFields = detectChangedFields(validation, existingLeadData);

          const dbDupRow: DbDuplicateRowV2 = {
            rowNumber,
            issueType: 'db_duplicate',
            displayData: {
              email: validation.normalizedData.email,
              phone: validation.normalizedData.phone,
              firstName: validation.normalizedData.first_name,
              lastName: validation.normalizedData.last_name,
              company: validation.normalizedData.company,
              externalId: validation.normalizedData.external_id,
            },
            matchedField: field,
            matchedValue: normalizedValue,
            existingLead: existingLeadData,
            changedFields,
          };

          duplicateRows.push(dbDupRow);

          rowDuplicateInfo.set(rowNumber, {
            validation,
            isDbDuplicate: true,
            matchedField: field,
            matchedValue: normalizedValue,
            existingLeadId: existingLead.id,
            existingLead: existingLeadData,
            changedFields,
          });
        }
      }
    }
  }

  // Build result for all rows
  const rows: RowWithDbDuplicateInfo[] = validatedRows.map((validation) => {
    const dupInfo = rowDuplicateInfo.get(validation.rowNumber);
    if (dupInfo) {
      return dupInfo;
    }
    return {
      validation,
      isDbDuplicate: false,
    };
  });

  return {
    rows,
    duplicateRows,
    duplicateCount: duplicateRows.length,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Map a database lead to ExistingLeadDataV2 format
 */
function mapLeadToExistingData(lead: Record<string, unknown>): ExistingLeadDataV2 {
  return {
    id: lead.id as string,
    email: lead.email as string | null,
    phone: lead.phone as string | null,
    firstName: lead.first_name as string | null,
    lastName: lead.last_name as string | null,
    company: lead.company as string | null,
    jobTitle: lead.job_title as string | null,
    externalId: lead.external_id as string | null,
    status: lead.status as string | null,
    assignedTo: lead.assigned_to as string | null,
    createdAt: lead.created_at as string,
    updatedAt: lead.updated_at as string,
  };
}

/**
 * Detect which fields have changed between import row and existing lead
 */
function detectChangedFields(
  validation: RowValidationResultV2,
  existingLead: ExistingLeadDataV2
): LeadFieldKey[] {
  const changedFields: LeadFieldKey[] = [];
  const fileData = validation.normalizedData;

  // Field mapping from import to existing lead
  const fieldMapping: Array<{
    importField: LeadFieldKey;
    existingField: keyof ExistingLeadDataV2;
  }> = [
    { importField: 'first_name', existingField: 'firstName' },
    { importField: 'last_name', existingField: 'lastName' },
    { importField: 'email', existingField: 'email' },
    { importField: 'phone', existingField: 'phone' },
    { importField: 'company', existingField: 'company' },
    { importField: 'job_title', existingField: 'jobTitle' },
    { importField: 'external_id', existingField: 'externalId' },
  ];

  for (const { importField, existingField } of fieldMapping) {
    const fileValue = fileData[importField];
    const existingValue = existingLead[existingField];

    // Skip if file doesn't have this field
    if (fileValue === undefined || fileValue === null || fileValue === '') {
      continue;
    }

    // Compare normalized values
    const normalizedFile = String(fileValue).toLowerCase().trim();
    const normalizedExisting = existingValue
      ? String(existingValue).toLowerCase().trim()
      : '';

    if (normalizedFile !== normalizedExisting) {
      changedFields.push(importField);
    }
  }

  return changedFields;
}

/**
 * Get non-duplicate rows (rows that don't match any existing lead)
 */
export function getNonDuplicateRows(
  result: DbDuplicateResult
): RowWithDbDuplicateInfo[] {
  return result.rows.filter((r) => !r.isDbDuplicate);
}

/**
 * Get summary of changed fields across all duplicates
 */
export function getChangedFieldsSummary(
  duplicateRows: DbDuplicateRowV2[]
): Record<LeadFieldKey, number> {
  const summary: Partial<Record<LeadFieldKey, number>> = {};

  for (const row of duplicateRows) {
    for (const field of row.changedFields) {
      summary[field] = (summary[field] || 0) + 1;
    }
  }

  return summary as Record<LeadFieldKey, number>;
}

/**
 * Build preview data for a specific DB duplicate row
 */
export function buildDbDuplicatePreview(
  validation: RowValidationResultV2,
  existingLead: ExistingLeadDataV2,
  matchedField: DuplicateCheckField,
  matchedValue: string,
  rowAction?: UnifiedRowAction
): DbDuplicateRowV2 {
  const changedFields = detectChangedFields(validation, existingLead);

  return {
    rowNumber: validation.rowNumber,
    issueType: 'db_duplicate',
    displayData: {
      email: validation.normalizedData.email,
      phone: validation.normalizedData.phone,
      firstName: validation.normalizedData.first_name,
      lastName: validation.normalizedData.last_name,
      company: validation.normalizedData.company,
      externalId: validation.normalizedData.external_id,
    },
    matchedField,
    matchedValue,
    existingLead,
    changedFields,
    rowAction,
  };
}

/**
 * Fetch existing lead by ID for comparison modal
 */
export async function fetchExistingLead(
  supabase: SupabaseClient,
  leadId: string
): Promise<ExistingLeadDataV2 | null> {
  const { data } = await supabase
    .from('leads')
    .select(`
      id,
      email,
      phone,
      first_name,
      last_name,
      company,
      job_title,
      address,
      city,
      postal_code,
      country,
      status,
      source,
      notes,
      external_id,
      assigned_to,
      created_at,
      updated_at
    `)
    .eq('id', leadId)
    .is('deleted_at', null)
    .single();

  if (!data) return null;

  return mapLeadToExistingData(data);
}
