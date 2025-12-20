/**
 * French column name aliases for smart auto-mapping
 *
 * Each lead field maps to an array of possible column names
 * that might appear in CSV/Excel files (French + English variants)
 */

import type { LeadFieldKey } from '../types';

// =============================================================================
// COLUMN ALIASES DICTIONARY
// =============================================================================

export const COLUMN_ALIASES: Record<LeadFieldKey, string[]> = {
  // Identity
  external_id: [
    'id',
    'external_id',
    'id_externe',
    'identifiant',
    'reference',
    'ref',
    'numero',
    'no',
    'code',
    'code_client',
    'lead_id',
    'customer_id',
    'client_id',
  ],

  // Name
  first_name: [
    'prenom',
    'prénom',
    'firstname',
    'first_name',
    'first name',
    'given_name',
    'given name',
    'nom_prenom', // Sometimes combined - will need special handling
  ],
  last_name: [
    'nom',
    'nom_de_famille',
    'nom de famille',
    'lastname',
    'last_name',
    'last name',
    'family_name',
    'family name',
    'surname',
    'full_name',
    'fullname',
    'name',
  ],

  // Contact
  email: [
    'email',
    'e-mail',
    'mail',
    'courriel',
    'adresse_email',
    'adresse_mail',
    'adresse email',
    'adresse mail',
    'email_address',
    'email address',
    'e_mail_principale',
    'email_principale',
    'email principale',
    'main_email',
  ],
  phone: [
    'telephone',
    'téléphone',
    'tel',
    'phone',
    'mobile',
    'portable',
    'gsm',
    'numero_telephone',
    'numero_tel',
    'phone_number',
    'phone number',
    'tel_mobile',
    'tel_fixe',
    'telephone_principal',
    'téléphone_principal',
    'telephone principal',
    'main_phone',
    'cell',
    'cellphone',
  ],

  // Company
  company: [
    'entreprise',
    'societe',
    'société',
    'company',
    'raison_sociale',
    'raison sociale',
    'nom_entreprise',
    'nom entreprise',
    'organization',
    'organisation',
    'business',
    'firm',
  ],
  job_title: [
    'fonction',
    'poste',
    'titre',
    'job_title',
    'job title',
    'job',
    'role',
    'position',
    'intitule_poste',
    'intitulé poste',
    'profession',
    'occupation',
  ],

  // Address
  address: [
    'adresse',
    'address',
    'rue',
    'street',
    'voie',
    'adresse_postale',
    'adresse postale',
    'numero_rue',
    'street_address',
    'full_address',
    'location',
  ],
  city: [
    'ville',
    'city',
    'commune',
    'localite',
    'localité',
    'town',
    'municipality',
  ],
  postal_code: [
    'code_postal',
    'code postal',
    'cp',
    'postal_code',
    'postalcode',
    'zip',
    'zipcode',
    'zip_code',
    'postcode',
  ],
  country: [
    'pays',
    'country',
    'nation',
    'region',
  ],

  // Lead info
  status: [
    'statut',
    'status',
    'etat',
    'état',
    'state',
    'lead_status',
    'lead status',
    'contact_status',
    'customer_status',
  ],
  source: [
    'source',
    'origine',
    'provenance',
    'canal',
    'channel',
    'campaign',
    'campagne',
    'utm_source',
    'campaign_name',
    'form_name',
    'platform',
    'ad_name',
    'adset_name',
  ],
  notes: [
    'notes',
    'note',
    'commentaire',
    'commentaires',
    'comment',
    'comments',
    'remarque',
    'remarques',
    'description',
    'observations',
    'info',
    'information',
    'details',
  ],

  // Assignment (special - for by_column assignment mode)
  assigned_to: [
    'commercial',
    'vendeur',
    'assigné',
    'assigne',
    'assigned_to',
    'assigned',
    'owner',
    'responsable',
    'sales_rep',
    'sales rep',
    'agent',
    'assigné_à',
    'assigne_a',
    'assigned to',
    'rep',
    'conseiller',
    'account_owner',
  ],
};

// =============================================================================
// LEAD FIELD LABELS (FRENCH) - CENTRALIZED in @/lib/constants/lead-fields.ts
// =============================================================================
// Note: Import from @/lib/constants for LEAD_FIELD_LABELS

// =============================================================================
// REQUIRED FIELDS - at least one of these must be present
// =============================================================================

export const REQUIRED_CONTACT_FIELDS: LeadFieldKey[] = [
  'email',
  'phone',
  'external_id',
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Normalize a column header for matching
 * - Lowercase
 * - Remove accents
 * - Remove extra whitespace
 * - Replace special chars with underscore
 */
export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .trim()
    .replace(/\s+/g, '_') // Spaces to underscores
    .replace(/[^a-z0-9_]/g, ''); // Remove special chars
}

/**
 * Calculate similarity between two strings (Levenshtein-based)
 * Returns a score from 0 to 1 (1 = exact match)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeHeader(str1);
  const s2 = normalizeHeader(str2);

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9;
  }

  // Levenshtein distance
  const matrix: number[][] = [];

  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[s1.length][s2.length];
  const maxLength = Math.max(s1.length, s2.length);

  return 1 - distance / maxLength;
}

/**
 * Find the best matching field for a given column header
 * Returns the field key and confidence score
 */
export function findBestMatch(
  header: string
): { field: LeadFieldKey | null; confidence: number } {
  const normalizedHeader = normalizeHeader(header);
  let bestMatch: LeadFieldKey | null = null;
  let bestScore = 0;

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const normalizedAlias = normalizeHeader(alias);

      // Exact match
      if (normalizedHeader === normalizedAlias) {
        return { field: field as LeadFieldKey, confidence: 1 };
      }

      // Similarity match
      const score = calculateSimilarity(normalizedHeader, normalizedAlias);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = field as LeadFieldKey;
      }
    }
  }

  return { field: bestMatch, confidence: bestScore };
}
