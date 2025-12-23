/**
 * Extract error message from unknown error type
 * Reduces duplication in try-catch blocks
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Erreur inconnue';
}

/**
 * Log a Supabase error with context
 * Provides consistent error logging across action files
 */
export function logSupabaseError(operation: string, error: unknown): void {
  console.error(`[Supabase] ${operation}:`, error);
}

/**
 * Log an action error with context
 */
export function logActionError(action: string, error: unknown): void {
  const message = getErrorMessage(error);
  console.error(`[Action: ${action}] ${message}`);
}

// ============================================
// Standardized Action Response Types (DRY)
// ============================================

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

/**
 * Create a success action result
 */
export function actionSuccess<T>(data?: T): ActionResult<T> {
  return { success: true, data };
}

/**
 * Create an error action result
 */
export function actionError(error: string): ActionResult<never> {
  return { success: false, error };
}

// ============================================
// Common French Error Messages (DRY)
// ============================================

export const FR_MESSAGES = {
  // Authentication
  UNAUTHENTICATED: 'Non authentifié',
  SESSION_EXPIRED: 'Session expirée',
  UNAUTHORIZED: "Vous n'avez pas accès à cette ressource",
  ADMIN_REQUIRED: 'Accès réservé aux administrateurs',

  // Validation
  INVALID_DATA: 'Données invalides',
  MISSING_DATA: 'Données manquantes',

  // Resources
  NOT_FOUND: 'Ressource non trouvée',
  LEAD_NOT_FOUND: 'Lead non trouvé',
  USER_NOT_FOUND: 'Utilisateur non trouvé',
  COMMENT_NOT_FOUND: 'Commentaire non trouvé',

  // Operations
  ERROR_GENERIC: 'Une erreur est survenue',
  ERROR_FETCH: 'Erreur lors de la récupération des données',
  ERROR_CREATE: 'Erreur lors de la création',
  ERROR_UPDATE: 'Erreur lors de la mise à jour',
  ERROR_DELETE: 'Erreur lors de la suppression',
  ERROR_STATUS_UPDATE: 'Erreur lors de la mise à jour du statut',
  ERROR_ASSIGN: "Erreur lors de l'assignation",
  ERROR_COMMENT_ADD: "Erreur lors de l'ajout du commentaire",

  // Leads specific
  NO_LEADS_SELECTED: 'Aucun lead sélectionné',
  CANNOT_DELETE_OTHERS_COMMENTS: 'Vous ne pouvez supprimer que vos propres commentaires',

  // Transfer
  ERROR_TRANSFER: 'Erreur lors du transfert du lead',
  CANNOT_SELF_TRANSFER: 'Vous ne pouvez pas vous transférer un lead à vous-même',
  TRANSFER_TO_SALES_ONLY: 'Le transfert est uniquement possible vers un commercial',

  // Success
  SUCCESS_CREATE: 'Créé avec succès',
  SUCCESS_UPDATE: 'Modifications enregistrées',
  SUCCESS_DELETE: 'Supprimé avec succès',
} as const;
