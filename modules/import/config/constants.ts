import type { ImportStatus, ImportRowStatus } from '@/db/types';

// =============================================================================
// FILE SIZE LIMITS
// =============================================================================

/** Maximum file size in bytes (100MB for large files) */
export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

/** Maximum file size in MB for display */
export const MAX_FILE_SIZE_MB = 100;

/** Allowed file extensions */
export const ALLOWED_FILE_EXTENSIONS = ['.csv', '.xlsx', '.xls'] as const;

/** Allowed MIME types */
export const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

// =============================================================================
// CHUNK PROCESSING
// =============================================================================

/** Number of rows to parse per chunk (for progress updates) */
export const PARSE_CHUNK_SIZE = 500;

/** Number of rows to commit per batch (for database inserts) */
export const COMMIT_BATCH_SIZE = 100;

/**
 * Always use client-side parsing to avoid Edge Function memory limits
 * The Edge Function has ~150MB memory and 60s timeout which fails on large files
 * Set to 0 to always use client-side parsing
 */
export const CLIENT_SIDE_PARSE_THRESHOLD = 0; // Always use client-side

/** Number of rows to send per batch when doing client-side parsing */
export const CLIENT_BATCH_SIZE = 500;

// =============================================================================
// VALIDATION
// =============================================================================

/** Minimum confidence score for auto-mapping (0-1) */
export const AUTO_MAP_CONFIDENCE_THRESHOLD = 0.7;

// =============================================================================
// STATUS LABELS (FRENCH)
// =============================================================================

export const IMPORT_STATUS_LABELS: Record<ImportStatus, string> = {
  queued: 'En file d\'attente',
  pending: 'En attente',
  parsing: 'Analyse en cours',
  validating: 'Validation en cours',
  ready: 'Prêt à importer',
  importing: 'Import en cours',
  completed: 'Terminé',
  failed: 'Échec',
  cancelled: 'Annulé',
};

export const IMPORT_STATUS_COLORS: Record<ImportStatus, string> = {
  queued: 'badge-secondary',
  pending: 'badge-secondary',
  parsing: 'badge-info',
  validating: 'badge-info',
  ready: 'badge-primary',
  importing: 'badge-warning',
  completed: 'badge-success',
  failed: 'badge-error',
  cancelled: 'badge-secondary',
};

export const IMPORT_ROW_STATUS_LABELS: Record<ImportRowStatus, string> = {
  pending: 'En attente',
  valid: 'Valide',
  invalid: 'Invalide',
  imported: 'Importé',
  skipped: 'Ignoré',
};

export const IMPORT_ROW_STATUS_COLORS: Record<ImportRowStatus, string> = {
  pending: 'badge-secondary',
  valid: 'badge-success',
  invalid: 'badge-error',
  imported: 'badge-success',
  skipped: 'badge-warning',
};

// =============================================================================
// WIZARD STEPS (6-step flow for comprehensive import UX)
// =============================================================================

export const IMPORT_WIZARD_STEPS = [
  { id: 'upload', number: 1, label: 'Fichier', description: 'Telecharger votre fichier CSV ou Excel' },
  { id: 'mapping', number: 2, label: 'Mapping', description: 'Associer les colonnes aux champs' },
  { id: 'options', number: 3, label: 'Options', description: 'Configurer les doublons et l\'attribution' },
  { id: 'preview', number: 4, label: 'Apercu', description: 'Verifier les donnees avant import' },
  { id: 'progress', number: 5, label: 'Import', description: 'Import en cours' },
  { id: 'results', number: 6, label: 'Resultats', description: 'Resume de l\'import' },
] as const;

export type ImportWizardStep = (typeof IMPORT_WIZARD_STEPS)[number]['id'];

// =============================================================================
// DUPLICATE HANDLING OPTIONS
// =============================================================================

export const DUPLICATE_STRATEGIES = [
  { value: 'skip', label: 'Ignorer les doublons' },
  { value: 'update', label: 'Mettre a jour les existants' },
  { value: 'create', label: 'Creer de nouveaux leads' },
] as const;

export type DuplicateStrategy = (typeof DUPLICATE_STRATEGIES)[number]['value'];

// =============================================================================
// ASSIGNMENT OPTIONS
// =============================================================================

export const ASSIGNMENT_MODES = [
  { value: 'none', label: 'Ne pas assigner' },
  { value: 'single', label: 'Assigner a un commercial' },
  { value: 'round_robin', label: 'Repartir entre commerciaux' },
  { value: 'by_column', label: 'Utiliser une colonne du fichier' },
] as const;

export type AssignmentMode = (typeof ASSIGNMENT_MODES)[number]['value'];
