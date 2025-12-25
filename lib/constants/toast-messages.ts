/**
 * Centralized Toast Messages Constants (DRY)
 * French messages for toast notifications
 *
 * Used across: all modules with user feedback
 */

// ============================================
// Success Messages
// ============================================

export const TOAST = {
  // Lead operations
  LEAD_DELETED: 'Lead supprimé',
  LEAD_TRANSFERRED: 'Lead transféré avec succès',
  LEADS_ASSIGNED: (count: number) =>
    `${count} lead${count > 1 ? 's' : ''} assigné${count > 1 ? 's' : ''}`,
  LEADS_PARTIAL_ASSIGNED: (assigned: number, total: number) =>
    `${assigned}/${total} leads assignés`,

  // Comment operations
  COMMENT_ADDED: 'Commentaire ajouté',
  COMMENT_DELETED: 'Commentaire supprimé',

  // Meeting operations
  MEETING_CREATED: 'Rendez-vous créé',
  MEETING_UPDATED: 'Rendez-vous modifié',
  MEETING_DELETED: 'Rendez-vous supprimé',

  // User operations
  USER_DELETED: 'Utilisateur supprimé',
  USER_CREATED: 'Utilisateur créé avec succès',

  // Note operations
  NOTE_CREATED: 'Note créée',
  NOTE_DELETED: 'Note supprimée',

  // Banner/Announcement operations
  BANNER_CREATED: 'Annonce créée avec succès',
  BANNER_UPDATED: 'Annonce mise à jour',
  BANNER_DELETED: 'Annonce supprimée',

  // Ticket operations
  TICKET_CREATED: 'Ticket créé avec succès',

  // Status operations
  STATUS_UPDATED: 'Statut mis à jour',

  // Export operations
  DOWNLOAD_STARTED: 'Téléchargement lancé',

  // Password operations
  PASSWORD_CHANGED: 'Mot de passe modifié avec succès',

  // ============================================
  // Error Messages
  // ============================================

  GENERIC_ERROR: 'Une erreur est survenue',
  ERROR_DELETE: 'Erreur lors de la suppression',
  ERROR_ASSIGN: "Erreur lors de l'assignation",
  ERROR_UPLOAD: 'Erreur lors du téléchargement',
  ERROR_SAVE: 'Erreur lors de la sauvegarde',
  ERROR_START: 'Erreur lors du démarrage',
  PAYMENT_ERROR: 'Une erreur est survenue. Veuillez réessayer.',
} as const;

// Type for toast message keys
export type ToastMessageKey = keyof typeof TOAST;
