/**
 * Centralized lead field labels (DRY)
 * Used across: leads, import modules
 */

/**
 * Lead field display labels in French
 * This is the SINGLE source of truth for field labels
 */
export const LEAD_FIELD_LABELS = {
  // Personal info
  first_name: 'Prénom',
  last_name: 'Nom',
  email: 'Email',
  phone: 'Téléphone',

  // Company info
  company: 'Entreprise',
  job_title: 'Fonction',

  // Address
  address: 'Adresse',
  city: 'Ville',
  postal_code: 'Code postal',
  country: 'Pays',

  // Source & status
  source: 'Source',
  status: 'Statut',

  // Notes
  notes: 'Notes',

  // Import/System fields
  external_id: 'ID externe',
  assigned_to: 'Assigné à',
  created_at: 'Date de création',
  updated_at: 'Dernière modification',
} as const;

export type LeadFieldKey = keyof typeof LEAD_FIELD_LABELS;

/**
 * Get display label for a lead field
 */
export function getLeadFieldLabel(field: string): string {
  return LEAD_FIELD_LABELS[field as LeadFieldKey] || field;
}
