/**
 * Row Validator for Import V2
 *
 * Validates and normalizes import rows using Zod schemas.
 * Returns detailed validation results for preview.
 */

import { z } from 'zod';
import type { LeadFieldKey } from '../../../import/types/mapping';
import type {
  ParsedRowV2,
  ColumnMappingV2,
  RowValidationResultV2,
  FieldValidationErrorV2,
  FieldValidationWarningV2,
} from '../../types';
import { LEAD_FIELD_LABELS } from '@/lib/constants';

// =============================================================================
// NORMALIZATION FUNCTIONS
// =============================================================================

/**
 * Common email domain typos and corrections
 */
const EMAIL_DOMAIN_CORRECTIONS: Record<string, string> = {
  'gmailcom': 'gmail.com',
  'gmailfr': 'gmail.fr',
  'gmalcom': 'gmail.com',
  'yahoofr': 'yahoo.fr',
  'yahoocom': 'yahoo.com',
  'hotmailcom': 'hotmail.com',
  'hotmailfr': 'hotmail.fr',
  'outlookcom': 'outlook.com',
  'outlookfr': 'outlook.fr',
  'lapostenet': 'laposte.net',
  'orangefr': 'orange.fr',
  'freefr': 'free.fr',
  'sfrfr': 'sfr.fr',
  'wanadoofr': 'wanadoo.fr',
};

/**
 * Try to fix common email domain typos
 */
export function tryFixEmailDomain(email: string): { email: string; wasFixed: boolean } {
  if (!email || !email.includes('@')) {
    return { email, wasFixed: false };
  }

  const [local, domain] = email.toLowerCase().trim().split('@');
  if (!domain) {
    return { email, wasFixed: false };
  }

  // Check if domain is in corrections map
  const correctedDomain = EMAIL_DOMAIN_CORRECTIONS[domain];
  if (correctedDomain) {
    return { email: `${local}@${correctedDomain}`, wasFixed: true };
  }

  // Try to detect missing dot before common TLDs
  if (!domain.includes('.')) {
    const tldPatterns = [
      { pattern: /(.+)(com)$/i, tld: '.com' },
      { pattern: /(.+)(fr)$/i, tld: '.fr' },
      { pattern: /(.+)(net)$/i, tld: '.net' },
      { pattern: /(.+)(org)$/i, tld: '.org' },
      { pattern: /(.+)(be)$/i, tld: '.be' },
    ];

    for (const { pattern, tld } of tldPatterns) {
      const match = domain.match(pattern);
      if (match && match[1].length >= 2) {
        return { email: `${local}@${match[1]}${tld}`, wasFixed: true };
      }
    }
  }

  return { email: email.toLowerCase().trim(), wasFixed: false };
}

/**
 * Normalize phone number to international format
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  let value = phone.trim();

  // Remove common prefixes like "p:" or "t:"
  if (/^[pt]:/i.test(value)) {
    value = value.slice(2);
  }

  // Remove all non-digit characters except + at start
  let normalized = value.replace(/[^\d+]/g, '');

  // Handle French numbers
  if (normalized.startsWith('0') && normalized.length === 10) {
    normalized = '+33' + normalized.slice(1);
  } else if (normalized.startsWith('33') && normalized.length === 11) {
    normalized = '+' + normalized;
  } else if (!normalized.startsWith('+') && normalized.length === 9) {
    normalized = '+33' + normalized;
  }

  return normalized || null;
}

/**
 * Normalize email
 */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const { email: fixed } = tryFixEmailDomain(email);
  return fixed || null;
}

/**
 * Normalize text (trim, collapse whitespace)
 */
export function normalizeText(text: string | null | undefined): string | null {
  if (!text) return null;
  return text.trim().replace(/\s+/g, ' ') || null;
}

/**
 * Normalize postal code
 */
export function normalizePostalCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const digits = code.replace(/\s/g, '');
  // Pad French 4-digit codes
  if (/^\d{4}$/.test(digits)) {
    return '0' + digits;
  }
  return digits || null;
}

/**
 * Capitalize first letter of each word (including after hyphens)
 */
export function capitalizeWords(text: string | null | undefined): string | null {
  if (!text) return null;
  return text
    .toLowerCase()
    .replace(/(?:^|[\s-])\S/g, (char) => char.toUpperCase());
}

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

export const emailSchema = z
  .string()
  .email('Format email invalide')
  .max(255, 'Email trop long')
  .optional()
  .nullable()
  .or(z.literal(''));

export const phoneSchema = z
  .string()
  .max(50, 'Numero trop long')
  .optional()
  .nullable();

export const importRowSchema = z.object({
  external_id: z.string().max(100).optional().nullable(),
  first_name: z.string().max(100).optional().nullable(),
  last_name: z.string().max(100).optional().nullable(),
  email: emailSchema,
  phone: phoneSchema,
  company: z.string().max(200).optional().nullable(),
  job_title: z.string().max(100).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  postal_code: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  status: z.string().max(50).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  assigned_to: z.string().optional().nullable(),
});

// =============================================================================
// MAIN VALIDATION FUNCTION
// =============================================================================

const REQUIRED_CONTACT_FIELDS: LeadFieldKey[] = ['email', 'phone'];

/**
 * Apply column mappings to a parsed row
 */
export function applyMapping(
  row: ParsedRowV2,
  mappings: ColumnMappingV2[]
): Partial<Record<LeadFieldKey, string | null>> {
  const result: Partial<Record<LeadFieldKey, string | null>> = {};

  for (const mapping of mappings) {
    if (mapping.targetField && mapping.sourceIndex < row.values.length) {
      const rawValue = row.values[mapping.sourceIndex]?.trim() || '';
      if (rawValue) {
        result[mapping.targetField] = rawValue;
      }
    }
  }

  return result;
}

/**
 * Normalize a mapped row
 */
export function normalizeRowData(
  data: Partial<Record<LeadFieldKey, string | null>>
): Partial<Record<LeadFieldKey, string | null>> {
  return {
    external_id: normalizeText(data.external_id),
    first_name: capitalizeWords(data.first_name),
    last_name: capitalizeWords(data.last_name),
    email: normalizeEmail(data.email),
    phone: normalizePhone(data.phone),
    company: capitalizeWords(data.company),
    job_title: normalizeText(data.job_title),
    address: normalizeText(data.address),
    city: capitalizeWords(data.city),
    postal_code: normalizePostalCode(data.postal_code),
    country: normalizeText(data.country) || 'France',
    status: normalizeText(data.status),
    source: normalizeText(data.source),
    notes: normalizeText(data.notes),
    assigned_to: normalizeText(data.assigned_to),
  };
}

/**
 * Validate a single row
 */
export function validateRow(
  row: ParsedRowV2,
  mappings: ColumnMappingV2[]
): RowValidationResultV2 {
  const errors: FieldValidationErrorV2[] = [];
  const warnings: FieldValidationWarningV2[] = [];

  // Apply mapping
  const mappedData = applyMapping(row, mappings);

  // Pre-normalize (for validation)
  const normalizedData = normalizeRowData(mappedData);

  // Track email auto-fix
  let emailWasFixed = false;
  if (mappedData.email) {
    const { wasFixed } = tryFixEmailDomain(mappedData.email);
    emailWasFixed = wasFixed;
  }

  // Zod validation
  const parsed = importRowSchema.safeParse(normalizedData);

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as LeadFieldKey;
      errors.push({
        field,
        message: issue.message,
        value: String(mappedData[field] || ''),
      });
    }
  }

  // Check for at least one contact field
  const hasContactInfo = REQUIRED_CONTACT_FIELDS.some(
    (field) => normalizedData[field] && String(normalizedData[field]).trim() !== ''
  );

  if (!hasContactInfo) {
    errors.push({
      field: 'email', // Use email as the representative field
      message: 'Au moins un champ de contact requis (email ou telephone)',
    });
  }

  // Additional email validation (beyond Zod)
  if (normalizedData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedData.email)) {
      // Only add if not already caught by Zod
      if (!errors.some((e) => e.field === 'email')) {
        errors.push({
          field: 'email',
          message: 'Format email invalide',
          value: normalizedData.email,
        });
      }
    } else if (emailWasFixed) {
      warnings.push({
        field: 'email',
        message: `Email corrige automatiquement (original: ${mappedData.email})`,
        value: normalizedData.email || undefined,
      });
    }
  }

  // Phone validation
  if (normalizedData.phone) {
    const cleanPhone = normalizedData.phone.replace(/[^\d+]/g, '');
    if (cleanPhone.length < 8) {
      errors.push({
        field: 'phone',
        message: 'Numero de telephone trop court',
        value: normalizedData.phone,
      });
    } else if (cleanPhone.length > 15) {
      warnings.push({
        field: 'phone',
        message: 'Numero de telephone inhabituellement long',
        value: normalizedData.phone,
      });
    }
  }

  // Warning: no name
  if (!normalizedData.first_name && !normalizedData.last_name) {
    warnings.push({
      field: 'first_name',
      message: 'Aucun nom renseigne',
    });
  }

  // Warning: no company
  if (!normalizedData.company) {
    warnings.push({
      field: 'company',
      message: 'Entreprise non renseignee',
    });
  }

  return {
    rowNumber: row.rowNumber,
    isValid: errors.length === 0,
    errors,
    warnings,
    normalizedData,
  };
}

/**
 * Validate multiple rows
 */
export function validateRows(
  rows: ParsedRowV2[],
  mappings: ColumnMappingV2[]
): RowValidationResultV2[] {
  return rows.map((row) => validateRow(row, mappings));
}

/**
 * Get French label for a field
 */
export function getFieldLabel(field: LeadFieldKey): string {
  return LEAD_FIELD_LABELS[field] || field;
}

/**
 * Format validation error for display
 */
export function formatValidationError(error: FieldValidationErrorV2): string {
  const label = getFieldLabel(error.field);
  if (error.value) {
    return `${label}: ${error.message} ("${error.value}")`;
  }
  return `${label}: ${error.message}`;
}
