/**
 * Export Module Constants
 */

import type { ExportStatus } from '../types';

// ============================================================================
// STATUS LABELS (French)
// ============================================================================

export const EXPORT_STATUS_LABELS: Record<ExportStatus, string> = {
  pending: 'En file d\'attente',
  processing: 'Génération en cours',
  completed: 'Terminé',
  failed: 'Échec',
  expired: 'Expiré',
};

// ============================================================================
// STATUS COLORS (CSS classes from globals.css)
// ============================================================================

export const EXPORT_STATUS_COLORS: Record<ExportStatus, string> = {
  pending: 'badge-secondary',
  processing: 'badge-info',
  completed: 'badge-success',
  failed: 'badge-error',
  expired: 'badge-warning',
};

// ============================================================================
// EXPORT LIMITS
// ============================================================================

export const EXPORT_LIMITS = [
  { value: 10000, label: '10 000 leads' },
  { value: 50000, label: '50 000 leads' },
  { value: null, label: 'Tous les leads' },
] as const;

export type ExportLimitValue = typeof EXPORT_LIMITS[number]['value'];

// Threshold for showing warning
export const EXPORT_WARNING_THRESHOLD = 50000;

// ============================================================================
// TIMING CONSTANTS
// ============================================================================

// File expiry in hours
export const EXPORT_FILE_EXPIRY_HOURS = 1;

// Chunk size for querying leads (Supabase limit)
export const EXPORT_CHUNK_SIZE = 1000;

// Max duration for QStash job (5 minutes)
export const EXPORT_MAX_DURATION_MS = 300000;

// Polling interval for status updates (ms)
export const EXPORT_POLL_INTERVAL_MS = 2000;

// ============================================================================
// STORAGE
// ============================================================================

export const EXPORT_BUCKET_NAME = 'exports';
