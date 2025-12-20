/**
 * Centralized lead status constants (DRY)
 * Used across: leads, import, db modules
 */

/**
 * All possible lead statuses
 */
export const LEAD_STATUSES = {
  NEW: 'Nouveau',
  TO_CONTACT: 'A contacter',
  CONTACTED: 'Contacte',
  MEETING_SCHEDULED: 'RDV planifie',
  MEETING_DONE: 'RDV effectue',
  PROPOSAL_SENT: 'Devis envoye',
  NEGOTIATION: 'En negociation',
  WON: 'Gagne',
  LOST: 'Perdu',
  NO_ANSWER: 'Pas de reponse',
  INVALID_NUMBER: 'Numero invalide',
  NOT_INTERESTED: 'Pas interesse',
  CALLBACK: 'A rappeler',
  DUPLICATE: 'Doublon',
} as const;

export type LeadStatus = (typeof LEAD_STATUSES)[keyof typeof LEAD_STATUSES];

/**
 * Lead status display labels (same as values since we use French labels)
 */
export const LEAD_STATUS_LABELS = LEAD_STATUSES;

/**
 * Status color mappings for badges
 */
export const LEAD_STATUS_COLORS: Record<string, string> = {
  Nouveau: 'badge-info',
  'A contacter': 'badge-primary',
  Contacte: 'badge-secondary',
  'RDV planifie': 'badge-warning',
  'RDV effectue': 'badge-warning',
  'Devis envoye': 'badge-primary',
  'En negociation': 'badge-warning',
  Gagne: 'badge-success',
  Perdu: 'badge-error',
  'Pas de reponse': 'badge-secondary',
  'Numero invalide': 'badge-error',
  'Pas interesse': 'badge-error',
  'A rappeler': 'badge-warning',
  Doublon: 'badge-secondary',
};

/**
 * Status options for dropdowns
 */
export const LEAD_STATUS_OPTIONS = Object.entries(LEAD_STATUSES).map(
  ([key, value]) => ({
    value,
    label: value,
    key,
  })
);

/**
 * Get color class for a status
 */
export function getStatusColor(status: string): string {
  return LEAD_STATUS_COLORS[status] || 'badge-secondary';
}
