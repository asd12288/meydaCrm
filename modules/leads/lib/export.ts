/**
 * CSV Export utilities for leads
 * Streaming-friendly, French headers, Excel compatible
 */

import type { LeadWithAssignee } from '../types';

// CSV column configuration with French headers
export const CSV_COLUMNS = [
  { key: 'last_name', header: 'Nom' },
  { key: 'first_name', header: 'Prénom' },
  { key: 'email', header: 'Email' },
  { key: 'phone', header: 'Téléphone' },
  { key: 'company', header: 'Entreprise' },
  { key: 'job_title', header: 'Fonction' },
  { key: 'address', header: 'Adresse' },
  { key: 'city', header: 'Ville' },
  { key: 'postal_code', header: 'Code postal' },
  { key: 'country', header: 'Pays' },
  { key: 'status_label', header: 'Statut' },
  { key: 'source', header: 'Source' },
  { key: 'notes', header: 'Notes' },
  { key: 'assignee_name', header: 'Commercial' },
  { key: 'external_id', header: 'ID externe' },
  { key: 'created_at', header: 'Date de création' },
  { key: 'updated_at', header: 'Dernière modification' },
] as const;

/**
 * Format a date to French format (dd/mm/yyyy HH:mm)
 */
function formatDateFR(dateString: string | null): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Escape a value for CSV format
 * - Wraps in quotes if contains comma, newline, or quote
 * - Escapes quotes by doubling them
 */
function escapeCsvValue(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';

  const str = String(value);

  // Check if we need to quote this value
  const needsQuotes = str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"');

  if (needsQuotes) {
    // Escape quotes by doubling them and wrap in quotes
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Convert a lead to a CSV row array
 */
export function formatLeadForCSV(lead: LeadWithAssignee): string[] {
  return CSV_COLUMNS.map(({ key }) => {
    switch (key) {
      case 'assignee_name':
        return lead.assignee?.display_name || '';
      case 'created_at':
      case 'updated_at':
        return formatDateFR(lead[key]);
      default:
        return lead[key as keyof LeadWithAssignee] as string || '';
    }
  });
}

/**
 * Encode an array of values as a CSV row string
 */
export function encodeCSVRow(values: string[]): Uint8Array {
  const line = values.map(escapeCsvValue).join(',') + '\n';
  return new TextEncoder().encode(line);
}

/**
 * Get CSV header row as encoded bytes
 */
export function getCSVHeader(): Uint8Array {
  const headers = CSV_COLUMNS.map(col => col.header);
  return encodeCSVRow(headers);
}

/**
 * UTF-8 BOM for Excel compatibility
 */
export const UTF8_BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);

/**
 * Export filters parsed from URL search params
 */
export interface ExportFilters {
  search?: string;
  status?: string;
  assignedTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Parse export filters from URLSearchParams
 */
export function parseExportFilters(searchParams: URLSearchParams): ExportFilters {
  return {
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    assignedTo: searchParams.get('assignedTo') || undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
  };
}

/**
 * Generate filename with current date
 */
export function getExportFilename(): string {
  const date = new Date().toISOString().split('T')[0];
  return `leads-export-${date}.csv`;
}

// =============================================================================
// Security utilities
// =============================================================================

/**
 * Allowed sort columns - whitelist to prevent SQL injection
 */
export const ALLOWED_SORT_COLUMNS = [
  'updated_at',
  'created_at',
  'last_name',
  'company',
  'status',
] as const;

export type AllowedSortColumn = (typeof ALLOWED_SORT_COLUMNS)[number];

/**
 * Validate that a sort column is in the whitelist
 */
export function isValidSortColumn(column: string | undefined): column is AllowedSortColumn {
  if (!column) return false;
  return ALLOWED_SORT_COLUMNS.includes(column as AllowedSortColumn);
}

/**
 * Sanitize search term to prevent PostgREST filter injection
 * Removes special characters that could manipulate the query
 */
export function sanitizeSearchTerm(term: string): string {
  return term
    .replace(/[,.()"'\\]/g, '') // Remove PostgREST special chars
    .trim()
    .substring(0, 100); // Limit length to prevent DoS
}
