/**
 * Import V2 Constants
 *
 * Configuration constants for the new import system
 */

// =============================================================================
// WIZARD STEPS (3-step flow)
// =============================================================================

export const WIZARD_STEPS = {
  UPLOAD: 'upload',
  PREVIEW: 'preview',
  IMPORT: 'import',
} as const;

export type WizardStepV2 = typeof WIZARD_STEPS[keyof typeof WIZARD_STEPS];

export const WIZARD_STEP_CONFIG: Record<WizardStepV2, {
  number: number;
  label: string;
  description: string;
}> = {
  upload: {
    number: 1,
    label: 'Fichier',
    description: 'Telecharger et mapper les colonnes',
  },
  preview: {
    number: 2,
    label: 'Apercu',
    description: 'Verifier les donnees et configurer',
  },
  import: {
    number: 3,
    label: 'Import',
    description: 'Importer et voir les resultats',
  },
};

// =============================================================================
// DUPLICATE STRATEGIES
// =============================================================================

export const DUPLICATE_STRATEGIES = {
  SKIP: 'skip',
  UPDATE: 'update',
  CREATE: 'create',
} as const;

export type DuplicateStrategyV2 = typeof DUPLICATE_STRATEGIES[keyof typeof DUPLICATE_STRATEGIES];

export const DUPLICATE_STRATEGY_LABELS: Record<DuplicateStrategyV2, string> = {
  skip: 'Ignorer',
  update: 'Mettre a jour',
  create: 'Creer nouveau',
};

export const DUPLICATE_STRATEGY_DESCRIPTIONS: Record<DuplicateStrategyV2, string> = {
  skip: 'Ne pas importer les doublons',
  update: 'Mettre a jour les leads existants',
  create: 'Creer un nouveau lead (doublon autorise)',
};

// =============================================================================
// ASSIGNMENT MODES
// =============================================================================

export const ASSIGNMENT_MODES = {
  NONE: 'none',
  ROUND_ROBIN: 'round_robin',
  BY_COLUMN: 'by_column',
} as const;

export type AssignmentModeV2 = typeof ASSIGNMENT_MODES[keyof typeof ASSIGNMENT_MODES];

export const ASSIGNMENT_MODE_LABELS: Record<AssignmentModeV2, string> = {
  none: 'Ne pas assigner',
  round_robin: 'Repartition automatique',
  by_column: 'Selon une colonne',
};

export const ASSIGNMENT_MODE_DESCRIPTIONS: Record<AssignmentModeV2, string> = {
  none: 'Les leads ne seront pas assignes',
  round_robin: 'Repartir equitablement entre les commerciaux selectionnes',
  by_column: 'Utiliser une colonne du fichier pour determiner l\'assignation',
};

// =============================================================================
// DUPLICATE CHECK FIELDS
// =============================================================================

// Only email is used for duplicate detection (per user requirement)
export const DUPLICATE_CHECK_FIELDS = ['email'] as const;
export type DuplicateCheckField = typeof DUPLICATE_CHECK_FIELDS[number];

export const DUPLICATE_FIELD_LABELS: Record<DuplicateCheckField, string> = {
  email: 'Email',
};

// =============================================================================
// IMPORT RESULT STATUSES
// =============================================================================

export const ROW_RESULT_STATUSES = {
  IMPORTED: 'imported',
  UPDATED: 'updated',
  SKIPPED: 'skipped',
  ERROR: 'error',
} as const;

export type RowResultStatus = typeof ROW_RESULT_STATUSES[keyof typeof ROW_RESULT_STATUSES];

export const ROW_RESULT_LABELS: Record<RowResultStatus, string> = {
  imported: 'Importe',
  updated: 'Mis a jour',
  skipped: 'Ignore',
  error: 'Erreur',
};

// =============================================================================
// FILE CONSTRAINTS
// =============================================================================

export const FILE_CONSTRAINTS = {
  MAX_SIZE_MB: 50,
  MAX_SIZE_BYTES: 50 * 1024 * 1024,
  ALLOWED_EXTENSIONS: ['csv', 'xlsx', 'xls'] as const,
  ALLOWED_MIME_TYPES: [
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ] as const,
};

// =============================================================================
// PROCESSING CONSTANTS
// =============================================================================

export const PROCESSING = {
  /** Rows per parsing chunk (for progress updates) */
  PARSE_CHUNK_SIZE: 500,
  /** Rows per commit batch (database inserts) */
  COMMIT_BATCH_SIZE: 100,
  /** Rows per duplicate check batch */
  DEDUPE_BATCH_SIZE: 100,
  /** Sample rows to show in preview */
  SAMPLE_ROW_COUNT: 5,
  /** Auto-mapping confidence threshold */
  AUTO_MAP_THRESHOLD: 0.7,
  /** Polling interval for progress (ms) */
  POLL_INTERVAL_MS: 2000,
  /** Max rows to show in results expandable section */
  MAX_RESULT_ROWS_DISPLAY: 100,
};

// =============================================================================
// IMPORT JOB STATUSES
// =============================================================================

export const IMPORT_JOB_STATUSES = {
  PENDING: 'pending',
  QUEUED: 'queued',
  PARSING: 'parsing',
  READY: 'ready',
  IMPORTING: 'importing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type ImportJobStatusV2 = typeof IMPORT_JOB_STATUSES[keyof typeof IMPORT_JOB_STATUSES];

export const IMPORT_STATUS_LABELS: Record<ImportJobStatusV2, string> = {
  pending: 'En attente',
  queued: 'En file d\'attente',
  parsing: 'Analyse en cours',
  ready: 'Pret pour l\'import',
  importing: 'Import en cours',
  completed: 'Termine',
  failed: 'Echec',
  cancelled: 'Annule',
};

// =============================================================================
// PROGRESS PHASES
// =============================================================================

export const PROGRESS_PHASES = {
  PREPARING: 'preparing',
  CHECKING_DUPLICATES: 'checking_duplicates',
  IMPORTING: 'importing',
  FINALIZING: 'finalizing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type ProgressPhase = typeof PROGRESS_PHASES[keyof typeof PROGRESS_PHASES];

export const PROGRESS_PHASE_LABELS: Record<ProgressPhase, string> = {
  preparing: 'Preparation...',
  checking_duplicates: 'Verification des doublons...',
  importing: 'Import en cours...',
  finalizing: 'Finalisation...',
  completed: 'Termine',
  failed: 'Echec',
};

// =============================================================================
// UNIFIED ROW ACTIONS (for all issue types in preview)
// =============================================================================

/**
 * Unified action type for all preview issue rows
 * - 'skip': Don't import this row
 * - 'import': Force import as new lead
 * - 'update': Update existing lead (DB duplicates only)
 */
export const UNIFIED_ROW_ACTIONS = {
  SKIP: 'skip',
  IMPORT: 'import',
  UPDATE: 'update',
} as const;

export type UnifiedRowAction = typeof UNIFIED_ROW_ACTIONS[keyof typeof UNIFIED_ROW_ACTIONS];

export const UNIFIED_ROW_ACTION_LABELS: Record<UnifiedRowAction, string> = {
  skip: 'Ignorer',
  import: 'Importer',
  update: 'Mettre a jour',
};

export const UNIFIED_ROW_ACTION_ICONS: Record<UnifiedRowAction, string> = {
  skip: 'IconX',
  import: 'IconPlus',
  update: 'IconReplace',
};

// =============================================================================
// ISSUE TYPES
// =============================================================================

export const PREVIEW_ISSUE_TYPES = {
  INVALID: 'invalid',
  FILE_DUPLICATE: 'file_duplicate',
  DB_DUPLICATE: 'db_duplicate',
} as const;

export type PreviewIssueType = typeof PREVIEW_ISSUE_TYPES[keyof typeof PREVIEW_ISSUE_TYPES];

export const PREVIEW_ISSUE_LABELS: Record<PreviewIssueType, string> = {
  invalid: 'Invalides',
  file_duplicate: 'Doublons fichier',
  db_duplicate: 'Doublons base',
};

/**
 * Available actions per issue type
 * - Invalid: skip or import (force import despite errors)
 * - File duplicate: skip or import (allow creating duplicate)
 * - DB duplicate: skip, import (create new), or update (merge)
 */
export const AVAILABLE_ACTIONS_BY_TYPE: Record<PreviewIssueType, UnifiedRowAction[]> = {
  invalid: ['skip', 'import'],
  file_duplicate: ['skip', 'import'],
  db_duplicate: ['skip', 'import', 'update'],
};

/**
 * Default action per issue type
 */
export const DEFAULT_ACTION_BY_TYPE: Record<PreviewIssueType, UnifiedRowAction> = {
  invalid: 'skip',
  file_duplicate: 'skip',
  db_duplicate: 'skip',
};
