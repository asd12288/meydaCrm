import type { ColumnMapping, LeadFieldKey } from '../types';
import {
  COLUMN_ALIASES,
  findBestMatch,
  normalizeHeader,
} from '../config/column-aliases';
import { LEAD_FIELD_LABELS, DISPLAY_LIMITS } from '@/lib/constants';
import { AUTO_MAP_CONFIDENCE_THRESHOLD } from '../config/constants';

// =============================================================================
// AUTO-MAPPING LOGIC
// =============================================================================

/**
 * Result of auto-mapping a single column
 */
export interface AutoMapResult {
  /** The matched field (null if no match found) */
  field: LeadFieldKey | null;
  /** Confidence score (0-1) */
  confidence: number;
  /** Alternative matches if primary match is uncertain */
  alternatives: Array<{ field: LeadFieldKey; confidence: number }>;
}

/**
 * Auto-map a single column header to a lead field
 */
export function autoMapColumn(header: string): AutoMapResult {
  const result = findBestMatch(header);

  // Find alternative matches
  const alternatives: Array<{ field: LeadFieldKey; confidence: number }> = [];

  if (result.confidence < 1) {
    // Check all fields for possible alternatives
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (field === result.field) continue;

      for (const alias of aliases) {
        const normalizedAlias = normalizeHeader(alias);
        const normalizedHeader = normalizeHeader(header);

        // Simple substring match
        if (
          normalizedHeader.includes(normalizedAlias) ||
          normalizedAlias.includes(normalizedHeader)
        ) {
          const altConfidence = Math.min(
            normalizedAlias.length / normalizedHeader.length,
            normalizedHeader.length / normalizedAlias.length
          ) * 0.8;

          if (altConfidence > 0.5) {
            alternatives.push({
              field: field as LeadFieldKey,
              confidence: altConfidence,
            });
          }
        }
      }
    }

    // Sort alternatives by confidence and deduplicate
    const uniqueAlternatives = new Map<LeadFieldKey, number>();
    for (const alt of alternatives) {
      const existing = uniqueAlternatives.get(alt.field);
      if (!existing || alt.confidence > existing) {
        uniqueAlternatives.set(alt.field, alt.confidence);
      }
    }

    alternatives.length = 0;
    for (const [field, confidence] of uniqueAlternatives) {
      alternatives.push({ field, confidence });
    }
    alternatives.sort((a, b) => b.confidence - a.confidence);
  }

  return {
    field: result.confidence >= AUTO_MAP_CONFIDENCE_THRESHOLD ? result.field : null,
    confidence: result.confidence,
    alternatives: alternatives.slice(0, DISPLAY_LIMITS.MAPPING_ALTERNATIVES), // Top alternatives
  };
}

/**
 * Auto-map all columns from a file
 */
export function autoMapColumns(
  headers: string[],
  sampleData: string[][] = []
): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const usedFields = new Set<LeadFieldKey>();

  // First pass: map high-confidence matches
  const preliminaryMappings: Array<{
    index: number;
    header: string;
    result: AutoMapResult;
  }> = [];

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const result = autoMapColumn(header);
    preliminaryMappings.push({ index: i, header, result });
  }

  // Sort by confidence (highest first) to assign best matches first
  preliminaryMappings.sort((a, b) => b.result.confidence - a.result.confidence);

  // Assign fields, avoiding duplicates
  for (const { index, header, result } of preliminaryMappings) {
    let assignedField: LeadFieldKey | null = null;
    let assignedConfidence = 0;

    if (result.field && !usedFields.has(result.field)) {
      assignedField = result.field;
      assignedConfidence = result.confidence;
      usedFields.add(result.field);
    } else if (result.field && usedFields.has(result.field)) {
      // Primary match already used, try alternatives
      for (const alt of result.alternatives) {
        if (!usedFields.has(alt.field)) {
          assignedField = alt.field;
          assignedConfidence = alt.confidence;
          usedFields.add(alt.field);
          break;
        }
      }
    }

    // Get sample values for this column
    const sampleValues: string[] = [];
    for (let row = 0; row < Math.min(5, sampleData.length); row++) {
      const value = sampleData[row]?.[index];
      if (value && value.trim()) {
        sampleValues.push(value.trim().slice(0, DISPLAY_LIMITS.VALUE_SAMPLE_LENGTH)); // Limit sample length
      }
    }

    mappings.push({
      sourceColumn: header,
      sourceIndex: index,
      targetField: assignedField,
      confidence: assignedField ? assignedConfidence : 0,
      isManual: false,
      sampleValues,
    });
  }

  // Sort back by original index
  mappings.sort((a, b) => a.sourceIndex - b.sourceIndex);

  return mappings;
}

/**
 * Get all available target fields with labels
 */
export function getAvailableTargetFields(): Array<{
  value: LeadFieldKey;
  label: string;
}> {
  return Object.entries(LEAD_FIELD_LABELS).map(([value, label]) => ({
    value: value as LeadFieldKey,
    label,
  }));
}

/**
 * Check if all required fields have mappings
 */
export function checkRequiredMappings(
  mappings: ColumnMapping[]
): {
  isComplete: boolean;
  missingFields: LeadFieldKey[];
  hasContactField: boolean;
} {
  const mappedFields = new Set(
    mappings.filter((m) => m.targetField).map((m) => m.targetField as LeadFieldKey)
  );

  // Check for at least one contact field
  const contactFields: LeadFieldKey[] = ['email', 'phone', 'external_id'];
  const hasContactField = contactFields.some((f) => mappedFields.has(f));

  // These fields should ideally be mapped but aren't strictly required
  const recommendedFields: LeadFieldKey[] = ['first_name', 'last_name'];
  const missingFields = recommendedFields.filter((f) => !mappedFields.has(f));

  return {
    isComplete: hasContactField,
    missingFields,
    hasContactField,
  };
}

/**
 * Generate mapping summary statistics
 */
export function getMappingSummary(mappings: ColumnMapping[]): {
  totalColumns: number;
  mappedColumns: number;
  unmappedColumns: number;
  highConfidenceCount: number;
  lowConfidenceCount: number;
  manualCount: number;
} {
  const mapped = mappings.filter((m) => m.targetField !== null);
  const highConfidence = mapped.filter(
    (m) => m.confidence >= AUTO_MAP_CONFIDENCE_THRESHOLD
  );
  const lowConfidence = mapped.filter(
    (m) => m.confidence < AUTO_MAP_CONFIDENCE_THRESHOLD && !m.isManual
  );
  const manual = mapped.filter((m) => m.isManual);

  return {
    totalColumns: mappings.length,
    mappedColumns: mapped.length,
    unmappedColumns: mappings.length - mapped.length,
    highConfidenceCount: highConfidence.length,
    lowConfidenceCount: lowConfidence.length,
    manualCount: manual.length,
  };
}
