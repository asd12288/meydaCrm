import {
  importRowDataSchema,
  type ImportRowData,
  type RowValidationResult,
  type FieldValidationError,
  type ValidationSummary,
  type LeadFieldKey,
} from '../types';
import { REQUIRED_CONTACT_FIELDS } from '../config/column-aliases';
import { LEAD_FIELD_LABELS } from '@/lib/constants';

// =============================================================================
// ROW VALIDATION
// =============================================================================

/**
 * Validate a single row of import data
 * Normalizes data BEFORE validation to handle common data issues
 */
export function validateRow(
  rowNumber: number,
  data: Partial<Record<LeadFieldKey, string>>
): RowValidationResult {
  const errors: FieldValidationError[] = [];
  const warnings: FieldValidationError[] = [];

  // Pre-normalize critical fields before validation
  // This handles common data issues like p: prefix on phones and missing dots in emails
  const preNormalizedData = {
    ...data,
    phone: data.phone ? normalizePhone(data.phone) : data.phone,
    email: data.email ? normalizeEmail(data.email) : data.email,
  };

  // Track if email was auto-fixed
  let emailWasFixed = false;
  if (data.email) {
    const { wasFixed } = tryFixEmailDomain(data.email);
    emailWasFixed = wasFixed;
  }

  // First, try to parse with Zod schema (using pre-normalized data)
  const parsed = importRowDataSchema.safeParse(preNormalizedData);

  if (!parsed.success) {
    // Extract Zod validation errors
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      errors.push({
        field,
        message: issue.message,
        value: data[field as LeadFieldKey] || undefined,
      });
    }
  }

  const normalizedData = parsed.success ? parsed.data : (preNormalizedData as ImportRowData);

  // Check for at least one contact field
  const hasContactInfo = REQUIRED_CONTACT_FIELDS.some(
    (field) => normalizedData[field] && String(normalizedData[field]).trim() !== ''
  );

  if (!hasContactInfo) {
    errors.push({
      field: 'contact',
      message: 'Au moins un champ de contact requis (email, telephone ou ID externe)',
    });
  }

  // Additional validations and warnings

  // Check for empty name
  if (!normalizedData.first_name && !normalizedData.last_name) {
    warnings.push({
      field: 'name',
      message: 'Aucun nom renseigne',
    });
  }

  // Check for empty company (warning only)
  if (!normalizedData.company) {
    warnings.push({
      field: 'company',
      message: 'Entreprise non renseignee',
    });
  }

  // Validate email format more strictly (on normalized email)
  if (normalizedData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedData.email)) {
      errors.push({
        field: 'email',
        message: 'Format email invalide',
        value: normalizedData.email,
      });
    } else if (emailWasFixed) {
      // Add warning that email was auto-corrected
      warnings.push({
        field: 'email',
        message: `Email corrigé automatiquement (original: ${data.email})`,
        value: normalizedData.email,
      });
    }
  }

  // Validate phone format (on normalized phone)
  if (normalizedData.phone) {
    // Phone is already normalized, just check length
    const cleanPhone = normalizedData.phone.replace(/[^\d+]/g, '');
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
      warnings.push({
        field: 'phone',
        message: 'Numero de telephone de longueur inhabituelle',
        value: normalizedData.phone,
      });
    }
  }

  return {
    rowNumber,
    isValid: errors.length === 0,
    errors,
    warnings,
    normalizedData,
  };
}

/**
 * Validate multiple rows and generate summary
 */
export function validateRows(
  rows: Array<{ rowNumber: number; data: Partial<Record<LeadFieldKey, string>> }>
): {
  results: RowValidationResult[];
  summary: ValidationSummary;
} {
  const results: RowValidationResult[] = [];
  const errorCounts: Record<string, { count: number; message: string }> = {};
  const warningCounts: Record<string, { count: number; message: string }> = {};

  for (const row of rows) {
    const result = validateRow(row.rowNumber, row.data);
    results.push(result);

    // Aggregate error counts
    for (const error of result.errors) {
      const key = `${error.field}:${error.message}`;
      if (!errorCounts[key]) {
        errorCounts[key] = { count: 0, message: error.message };
      }
      errorCounts[key].count++;
    }

    // Aggregate warning counts
    for (const warning of result.warnings) {
      const key = `${warning.field}:${warning.message}`;
      if (!warningCounts[key]) {
        warningCounts[key] = { count: 0, message: warning.message };
      }
      warningCounts[key].count++;
    }
  }

  const validRows = results.filter((r) => r.isValid).length;
  const invalidRows = results.length - validRows;

  const summary: ValidationSummary = {
    totalRows: results.length,
    validRows,
    invalidRows,
    duplicateRows: 0, // Will be calculated separately
    errors: Object.entries(errorCounts).map(([key, value]) => ({
      field: key.split(':')[0],
      count: value.count,
      message: value.message,
    })),
    warnings: Object.entries(warningCounts).map(([key, value]) => ({
      field: key.split(':')[0],
      count: value.count,
      message: value.message,
    })),
  };

  return { results, summary };
}

// =============================================================================
// DUPLICATE DETECTION
// =============================================================================

/**
 * Find duplicates within the file
 */
export function findDuplicatesInFile(
  rows: RowValidationResult[],
  checkFields: LeadFieldKey[]
): Map<number, { matchedRow: number; field: LeadFieldKey; value: string }> {
  const duplicates = new Map<
    number,
    { matchedRow: number; field: LeadFieldKey; value: string }
  >();
  const seen: Record<string, Record<string, number>> = {};

  // Initialize seen maps for each field
  for (const field of checkFields) {
    seen[field] = {};
  }

  for (const row of rows) {
    for (const field of checkFields) {
      const value = row.normalizedData[field];
      if (value && String(value).trim() !== '') {
        const normalizedValue = String(value).toLowerCase().trim();

        if (seen[field][normalizedValue] !== undefined) {
          duplicates.set(row.rowNumber, {
            matchedRow: seen[field][normalizedValue],
            field,
            value: String(value),
          });
          break; // Only report first duplicate match
        } else {
          seen[field][normalizedValue] = row.rowNumber;
        }
      }
    }
  }

  return duplicates;
}

// =============================================================================
// DATA NORMALIZATION
// =============================================================================

/**
 * Normalize phone number to international format
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  let value = phone.trim();

  // Remove common prefixes like "p:" or "t:" (from CRM exports)
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
  } else if (!normalized.startsWith('+') && normalized.length >= 10) {
    // Assume French if no country code
    if (normalized.length === 9) {
      normalized = '+33' + normalized;
    }
  }

  return normalized || null;
}

/**
 * Common email domain typos and their corrections
 * Maps broken domain to correct domain
 */
const EMAIL_DOMAIN_CORRECTIONS: Record<string, string> = {
  // Gmail
  'gmailcom': 'gmail.com',
  'gmailfr': 'gmail.fr',
  'gmalcom': 'gmail.com',
  'gmailc': 'gmail.com',
  // Yahoo
  'yahoofr': 'yahoo.fr',
  'yahoocom': 'yahoo.com',
  'yahoofrance': 'yahoo.fr',
  // Hotmail/Outlook
  'hotmailcom': 'hotmail.com',
  'hotmailfr': 'hotmail.fr',
  'outlookcom': 'outlook.com',
  'outlookfr': 'outlook.fr',
  'livecom': 'live.com',
  'livefr': 'live.fr',
  // French providers
  'lapostenet': 'laposte.net',
  'orangefr': 'orange.fr',
  'aboringeesfr': 'sosh.fr',
  'freefr': 'free.fr',
  'sfr.fr': 'sfr.fr',
  'sfrfr': 'sfr.fr',
  'wanadoofr': 'wanadoo.fr',
  'numaborinfr': 'numericable.fr',
  'bouyguescom': 'bouygues.com',
  // Belgian providers
  'proximusbe': 'proximus.be',
  'skynetbe': 'skynet.be',
  'telenetbe': 'telenet.be',
  // Generic TLD fixes
  'comfr': 'com',
  'frcom': 'fr',
};

/**
 * Try to fix common email domain typos
 * Returns corrected email or original if no fix found
 */
export function tryFixEmailDomain(email: string): { email: string; wasFixed: boolean } {
  if (!email || !email.includes('@')) {
    return { email, wasFixed: false };
  }

  const [local, domain] = email.toLowerCase().trim().split('@');
  if (!domain) {
    return { email, wasFixed: false };
  }

  // Check if domain is in our corrections map
  const correctedDomain = EMAIL_DOMAIN_CORRECTIONS[domain];
  if (correctedDomain) {
    return { email: `${local}@${correctedDomain}`, wasFixed: true };
  }

  // Try to detect missing dot before common TLDs
  // Pattern: domain without dot before tld (e.g., "gmailcom" not caught above)
  const tldPatterns = [
    { pattern: /(.+)(com)$/i, tld: '.com' },
    { pattern: /(.+)(fr)$/i, tld: '.fr' },
    { pattern: /(.+)(net)$/i, tld: '.net' },
    { pattern: /(.+)(org)$/i, tld: '.org' },
    { pattern: /(.+)(be)$/i, tld: '.be' },
    { pattern: /(.+)(de)$/i, tld: '.de' },
    { pattern: /(.+)(eu)$/i, tld: '.eu' },
    { pattern: /(.+)(io)$/i, tld: '.io' },
  ];

  // Only try to fix if domain doesn't already have a dot
  if (!domain.includes('.')) {
    for (const { pattern, tld } of tldPatterns) {
      const match = domain.match(pattern);
      if (match && match[1].length >= 2) {
        // Ensure there's at least 2 chars before TLD
        const fixedDomain = match[1] + tld;
        return { email: `${local}@${fixedDomain}`, wasFixed: true };
      }
    }
  }

  return { email: email.toLowerCase().trim(), wasFixed: false };
}

/**
 * Normalize email to lowercase and trim, with optional auto-fix for common typos
 */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const { email: fixed } = tryFixEmailDomain(email);
  return fixed || null;
}

/**
 * Normalize text field (trim whitespace, normalize unicode)
 */
export function normalizeText(text: string | null | undefined): string | null {
  if (!text) return null;
  return text.trim().replace(/\s+/g, ' ') || null;
}

/**
 * Normalize postal code (French format)
 */
export function normalizePostalCode(
  postalCode: string | null | undefined
): string | null {
  if (!postalCode) return null;
  // Remove spaces and keep only digits
  const normalized = postalCode.replace(/\s/g, '');
  // Pad with leading zeros if needed (French postal codes are 5 digits)
  if (/^\d{4}$/.test(normalized)) {
    return '0' + normalized;
  }
  return normalized || null;
}

/**
 * Normalize a complete row of data
 */
export function normalizeRowData(
  data: Partial<Record<LeadFieldKey, string>>
): ImportRowData {
  return {
    external_id: normalizeText(data.external_id),
    first_name: normalizeText(data.first_name),
    last_name: normalizeText(data.last_name),
    email: normalizeEmail(data.email),
    phone: normalizePhone(data.phone),
    company: normalizeText(data.company),
    job_title: normalizeText(data.job_title),
    address: normalizeText(data.address),
    city: normalizeText(data.city),
    postal_code: normalizePostalCode(data.postal_code),
    country: normalizeText(data.country) || 'France',
    status: normalizeText(data.status),
    source: normalizeText(data.source),
    notes: normalizeText(data.notes),
    assigned_to: normalizeText(data.assigned_to),
  };
}

// =============================================================================
// FIELD LABEL HELPERS
// =============================================================================

/**
 * Get French label for a field
 */
export function getFieldLabel(field: string): string {
  return LEAD_FIELD_LABELS[field as LeadFieldKey] || field;
}
