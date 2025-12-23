/**
 * Centralized lead status constants (DRY)
 * Used across: leads, import, db modules
 *
 * Database enum values: new, contacted, qualified, proposal, negotiation,
 * won, lost, no_answer, rdv, no_answer_1, no_answer_2, wrong_number,
 * not_interested, deposit, callback, relance, mail
 *
 * NOTE: Color mappings are now in status-colors.ts
 */

/**
 * All possible lead statuses (matches database enum)
 * Key = database enum value, Value = French display label
 */
export const LEAD_STATUSES = {
  new: 'Nouveau',
  rdv: 'RDV',
  no_answer_1: 'Pas de réponse 1',
  no_answer_2: 'Pas de réponse 2',
  wrong_number: 'Faux numéro',
  not_interested: 'Pas intéressé',
  deposit: 'Dépôt',
  callback: 'Rappeler',
  relance: 'Relance',
  mail: 'Mail',
} as const;

/**
 * Legacy statuses (in DB but not shown in UI)
 */
export const LEGACY_STATUSES = {
  contacted: 'Contacté',
  qualified: 'Qualifié',
  proposal: 'Proposition',
  negotiation: 'En négociation',
  won: 'Gagné',
  lost: 'Perdu',
  no_answer: 'Pas de réponse',
} as const;

/**
 * All statuses (for display of existing data)
 */
export const ALL_STATUSES = { ...LEAD_STATUSES, ...LEGACY_STATUSES } as const;

export type LeadStatusKey = keyof typeof LEAD_STATUSES;
export type LeadStatusLabel = (typeof LEAD_STATUSES)[LeadStatusKey];

/**
 * Lead status display labels (French)
 */
export const LEAD_STATUS_LABELS = LEAD_STATUSES;

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
