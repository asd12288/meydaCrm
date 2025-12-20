/**
 * Optimized Duplicate Detection
 *
 * Uses cursor-based pagination to efficiently build a dedupe set
 * from the leads table. This avoids loading all leads at once and
 * works well with large datasets (100k+ rows).
 *
 * Key optimizations:
 * - Cursor pagination (no offset = consistent performance)
 * - Only fetches required fields
 * - Uses indexed queries
 * - Builds a Set for O(1) lookups
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export type DedupeField = 'email' | 'phone' | 'external_id';

export interface DedupeConfig {
  /** Fields to check for duplicates */
  checkFields: DedupeField[];
  /** Whether to check against existing database leads */
  checkDatabase: boolean;
  /** Whether to check for duplicates within the file */
  checkWithinFile: boolean;
}

export interface DedupeResult {
  isDuplicate: boolean;
  duplicateField?: DedupeField;
  duplicateValue?: string;
  existingLeadId?: string;
}

// ============================================================================
// DEDUPE SET BUILDER
// ============================================================================

const BATCH_SIZE = 10000; // Rows per pagination query

/**
 * Build a Set of existing values for fast O(1) duplicate lookups
 *
 * Uses cursor-based pagination for consistent performance with large datasets.
 * Each entry in the Set is formatted as "field:value" for unique keys.
 *
 * @param supabase - Supabase admin client
 * @param config - Dedupe configuration
 * @returns Set of "field:value" strings for fast lookup
 *
 * @example
 * ```ts
 * const dedupeSet = await buildDedupeSet(supabase, {
 *   checkFields: ['email', 'phone'],
 *   checkDatabase: true,
 *   checkWithinFile: false,
 * });
 *
 * // Check if email exists
 * dedupeSet.has('email:john@example.com'); // true/false
 * ```
 */
export async function buildDedupeSet(
  supabase: SupabaseClient,
  config: DedupeConfig
): Promise<Set<string>> {
  const dedupeSet = new Set<string>();

  if (!config.checkDatabase || config.checkFields.length === 0) {
    return dedupeSet;
  }

  console.log(`[Dedupe] Building set for fields: ${config.checkFields.join(', ')}`);
  const startTime = Date.now();

  for (const field of config.checkFields) {
    let cursor: string | null = null;
    let totalLoaded = 0;

    while (true) {
      // Build query with cursor pagination
      let query = supabase
        .from('leads')
        .select(`id, ${field}`)
        .not(field, 'is', null)
        .is('deleted_at', null) // Only active leads
        .order('id', { ascending: true })
        .limit(BATCH_SIZE);

      // Apply cursor if not first page
      if (cursor) {
        query = query.gt('id', cursor);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`[Dedupe] Error loading ${field}:`, error);
        break;
      }

      if (!data || data.length === 0) {
        break;
      }

      // Add values to set
      for (const lead of data) {
         
        const value = ((lead as Record<string, unknown>)[field] as string)?.toLowerCase?.().trim();
        if (value) {
          dedupeSet.add(`${field}:${value}`);
        }
      }

      totalLoaded += data.length;

      // Update cursor for next page
      cursor = data[data.length - 1].id;

      // Check if we've reached the end
      if (data.length < BATCH_SIZE) {
        break;
      }
    }

    console.log(`[Dedupe] Loaded ${totalLoaded} ${field} values`);
  }

  console.log(
    `[Dedupe] Built set with ${dedupeSet.size} entries in ${Date.now() - startTime}ms`
  );

  return dedupeSet;
}

/**
 * Check if a row is a duplicate
 *
 * @param row - Normalized row data
 * @param fields - Fields to check
 * @param databaseSet - Set of existing database values
 * @param fileSet - Set of values already seen in the file
 * @returns DedupeResult with duplicate info
 */
export function checkDuplicate(
  row: Record<string, string | null>,
  fields: DedupeField[],
  databaseSet: Set<string>,
  fileSet: Set<string>
): DedupeResult {
  for (const field of fields) {
    const value = row[field]?.toLowerCase?.().trim();
    if (!value) continue;

    const key = `${field}:${value}`;

    // Check database first
    if (databaseSet.has(key)) {
      return {
        isDuplicate: true,
        duplicateField: field,
        duplicateValue: value,
      };
    }

    // Check within file
    if (fileSet.has(key)) {
      return {
        isDuplicate: true,
        duplicateField: field,
        duplicateValue: value,
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Add row values to the file dedupe set
 *
 * Call this after successfully processing a row to track it for
 * within-file duplicate detection.
 */
export function addToFileSet(
  row: Record<string, string | null>,
  fields: DedupeField[],
  fileSet: Set<string>
): void {
  for (const field of fields) {
    const value = row[field]?.toLowerCase?.().trim();
    if (value) {
      fileSet.add(`${field}:${value}`);
    }
  }
}

/**
 * Find the existing lead ID for a duplicate
 *
 * Only called when we need to update an existing lead.
 * Uses indexed query for fast lookup.
 */
export async function findExistingLeadId(
  supabase: SupabaseClient,
  field: DedupeField,
  value: string
): Promise<string | null> {
  const { data } = await supabase
    .from('leads')
    .select('id')
    .eq(field, value)
    .is('deleted_at', null)
    .limit(1)
    .single();

  return data?.id ?? null;
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Pre-load lead IDs for a batch of duplicate rows (for update strategy)
 *
 * More efficient than individual queries when updating many duplicates.
 */
export async function findExistingLeadIds(
  supabase: SupabaseClient,
  duplicates: Array<{ field: DedupeField; value: string }>
): Promise<Map<string, string>> {
  const leadIdMap = new Map<string, string>();

  // Group by field for efficient querying
  const byField = new Map<DedupeField, string[]>();
  for (const { field, value } of duplicates) {
    if (!byField.has(field)) {
      byField.set(field, []);
    }
    byField.get(field)!.push(value);
  }

  // Query each field
  for (const [field, values] of byField) {
    // Process in batches (Postgres IN clause limit)
    const BATCH = 100;
    for (let i = 0; i < values.length; i += BATCH) {
      const batch = values.slice(i, i + BATCH);

      const { data } = await supabase
        .from('leads')
        .select(`id, ${field}`)
        .in(field, batch)
        .is('deleted_at', null);

      if (data) {
        for (const lead of data) {
           
          const fieldValue = (lead as Record<string, unknown>)[field] as string;
          const key = `${field}:${fieldValue.toLowerCase().trim()}`;
          leadIdMap.set(key, lead.id);
        }
      }
    }
  }

  return leadIdMap;
}
