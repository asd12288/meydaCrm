/**
 * French error messages for import system
 */

export const IMPORT_ERRORS = {
  // File errors
  FILE_TOO_LARGE: 'Fichier trop volumineux (max 100 MB)',
  INVALID_FORMAT: 'Format de fichier non supporté. Utilisez CSV ou Excel (.xlsx)',
  FILE_UPLOAD_FAILED: 'Erreur lors du téléchargement du fichier',
  DUPLICATE_FILE: 'Ce fichier a déjà été importé',
  FILE_NOT_FOUND: 'Fichier introuvable',

  // Validation errors
  NO_VALID_ROWS: 'Aucune ligne valide trouvée',
  MISSING_HEADERS: 'En-têtes de colonnes manquants',
  INVALID_DATA: 'Données invalides détectées',
  REQUIRED_FIELD_MISSING: 'Au moins un champ de contact requis (email, téléphone ou ID externe)',

  // Processing errors
  PARSE_FAILED: 'Erreur lors de l\'analyse du fichier',
  IMPORT_FAILED: 'Erreur lors de l\'import',
  TIMEOUT: 'Délai d\'attente dépassé',
  NETWORK_ERROR: 'Erreur de connexion',
  
  // Job errors
  JOB_NOT_FOUND: 'Job d\'import introuvable',
  JOB_NOT_READY: 'Le job n\'est pas prêt pour l\'import',
  JOB_ALREADY_PROCESSING: 'Un import est déjà en cours',
  JOB_CANCELLED: 'Import annulé',

  // Permission errors
  UNAUTHORIZED: 'Accès non autorisé',
  ADMIN_REQUIRED: 'Droits administrateur requis',

  // System errors
  DATABASE_ERROR: 'Erreur de base de données',
  STORAGE_ERROR: 'Erreur de stockage',
  QUEUE_ERROR: 'Erreur de mise en file d\'attente',
  UNKNOWN_ERROR: 'Erreur inconnue',

  // Success messages
  UPLOAD_SUCCESS: 'Fichier téléchargé avec succès',
  IMPORT_SUCCESS: 'Import réussi',
  JOB_QUEUED: 'Import mis en file d\'attente',
} as const;

export type ImportError = keyof typeof IMPORT_ERRORS;

/**
 * Get friendly error message
 */
export function getImportErrorMessage(error: ImportError | string): string {
  if (error in IMPORT_ERRORS) {
    return IMPORT_ERRORS[error as ImportError];
  }
  return error;
}

/**
 * Format validation error for display
 */
export function formatValidationError(
  field: string,
  error: string
): string {
  const fieldLabels: Record<string, string> = {
    email: 'Email',
    phone: 'Téléphone',
    first_name: 'Prénom',
    last_name: 'Nom',
    company: 'Entreprise',
    external_id: 'ID externe',
    address: 'Adresse',
    city: 'Ville',
    postal_code: 'Code postal',
    country: 'Pays',
  };

  const fieldLabel = fieldLabels[field] || field;
  return `${fieldLabel}: ${error}`;
}
