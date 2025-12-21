/**
 * French column name aliases for smart auto-mapping
 *
 * Each lead field maps to an array of possible column names
 * that might appear in CSV/Excel files (French + English variants)
 *
 * Sources covered:
 * - French CRM exports (various naming conventions)
 * - English CRM exports (Hubspot, Salesforce, Zoho, Pipedrive)
 * - Facebook Lead Ads exports
 * - Google Ads Lead Form exports
 * - LinkedIn Lead Gen exports
 * - Generic CSV/Excel exports
 * - Numbered/indexed fields (phone_1, email_2, etc.)
 */

import type { LeadFieldKey } from '../types';

// =============================================================================
// COLUMN ALIASES DICTIONARY
// =============================================================================

export const COLUMN_ALIASES: Record<LeadFieldKey, string[]> = {
  // -------------------------------------------------------------------------
  // IDENTITY / REFERENCE
  // -------------------------------------------------------------------------
  external_id: [
    // French
    'id',
    'id_externe',
    'identifiant',
    'reference',
    'ref',
    'numero',
    'no',
    'n°',
    'num',
    'numero_client',
    'no_client',
    'code',
    'code_client',
    'code_prospect',
    'ref_client',
    'ref_prospect',
    'id_client',
    'id_prospect',
    'id_contact',
    'numero_dossier',
    'no_dossier',
    'ref_dossier',
    // English
    'external_id',
    'externalid',
    'lead_id',
    'leadid',
    'customer_id',
    'customerid',
    'client_id',
    'clientid',
    'contact_id',
    'contactid',
    'prospect_id',
    'record_id',
    'recordid',
    'unique_id',
    'uid',
    'uuid',
    'crm_id',
    'account_id',
    // CRM-specific
    'hubspot_id',
    'salesforce_id',
    'zoho_id',
    'pipedrive_id',
    'sf_id',
    'hs_object_id',
    // Facebook/Meta
    'fb_lead_id',
    'facebook_lead_id',
    'meta_lead_id',
    // Google
    'google_lead_id',
    'gclid',
  ],

  // -------------------------------------------------------------------------
  // NAME FIELDS
  // -------------------------------------------------------------------------
  first_name: [
    // French
    'prenom',
    'prénom',
    'prenoms',
    'prénoms',
    'premier_prenom',
    'prenom_1',
    'prenom1',
    // English
    'firstname',
    'first_name',
    'first name',
    'first',
    'given_name',
    'given name',
    'givenname',
    'forename',
    'fname',
    'f_name',
    // CRM formats
    'contact_first_name',
    'lead_first_name',
    'customer_first_name',
    'person_first_name',
    // Facebook Lead Ads
    'first_name_fb',
    // Combined (for special handling)
    'nom_prenom',
    'prenom_nom',
  ],

  last_name: [
    // French
    'nom',
    'nom_de_famille',
    'nom de famille',
    'nom_famille',
    'patronyme',
    'nom_1',
    'nom1',
    // English
    'lastname',
    'last_name',
    'last name',
    'last',
    'family_name',
    'family name',
    'familyname',
    'surname',
    'sname',
    'lname',
    'l_name',
    // Full name variants (often contains last name)
    'full_name',
    'fullname',
    'full name',
    'name',
    'nom_complet',
    'nom complet',
    // CRM formats
    'contact_last_name',
    'lead_last_name',
    'customer_last_name',
    'person_last_name',
    'contact_name',
    'lead_name',
    'customer_name',
    // Facebook Lead Ads
    'last_name_fb',
  ],

  // -------------------------------------------------------------------------
  // EMAIL
  // -------------------------------------------------------------------------
  email: [
    // French
    'email',
    'e-mail',
    'mail',
    'courriel',
    'courrier_electronique',
    'adresse_email',
    'adresse_mail',
    'adresse email',
    'adresse mail',
    'email_principale',
    'email principale',
    'email_principal',
    'mail_principal',
    'email_pro',
    'email_professionnel',
    'email_perso',
    'email_personnel',
    'email_travail',
    'email_1',
    'email1',
    'mail_1',
    'mail1',
    'e_mail',
    // English
    'email_address',
    'email address',
    'emailaddress',
    'e_mail_address',
    'main_email',
    'primary_email',
    'primaryemail',
    'work_email',
    'workemail',
    'business_email',
    'personal_email',
    'home_email',
    'contact_email',
    'customer_email',
    'lead_email',
    'user_email',
    // CRM formats
    'hs_email',
    'sf_email',
    'email_field',
    'emailfield',
    // Indexed
    'email_2',
    'email2',
    'secondary_email',
    'alt_email',
    'alternate_email',
    // Facebook Lead Ads
    'email_fb',
    'fb_email',
  ],

  // -------------------------------------------------------------------------
  // PHONE
  // -------------------------------------------------------------------------
  phone: [
    // French
    'telephone',
    'téléphone',
    'tel',
    'tél',
    'telephonne', // Common typo
    'numero_telephone',
    'numéro_téléphone',
    'numero_tel',
    'num_tel',
    'no_tel',
    'n_tel',
    'tel_principal',
    'telephone_principal',
    'téléphone_principal',
    'telephone principal',
    'tel_1',
    'tel1',
    'telephone_1',
    'telephone1',
    // Mobile French
    'mobile',
    'portable',
    'gsm',
    'tel_mobile',
    'tel_portable',
    'telephone_mobile',
    'telephone_portable',
    'numero_mobile',
    'numero_portable',
    'mobile_1',
    'portable_1',
    // Landline French
    'fixe',
    'tel_fixe',
    'telephone_fixe',
    'ligne_fixe',
    'tel_domicile',
    'tel_maison',
    // Work French
    'tel_travail',
    'tel_bureau',
    'tel_pro',
    'telephone_professionnel',
    'tel_professionnel',
    // English
    'phone',
    'phone_number',
    'phone number',
    'phonenumber',
    'telephone_number',
    'tel_number',
    'main_phone',
    'primary_phone',
    'primaryphone',
    'phone_1',
    'phone1',
    // Mobile English
    'cell',
    'cellphone',
    'cell_phone',
    'cell phone',
    'cellular',
    'mobile_phone',
    'mobilephone',
    'mobile_number',
    'mobilenumber',
    // Work English
    'work_phone',
    'workphone',
    'business_phone',
    'office_phone',
    // Home English
    'home_phone',
    'homephone',
    'personal_phone',
    // CRM formats
    'contact_phone',
    'customer_phone',
    'lead_phone',
    'hs_phone',
    // Indexed
    'phone_2',
    'phone2',
    'tel_2',
    'tel2',
    'secondary_phone',
    'alt_phone',
    'alternate_phone',
    // Facebook Lead Ads
    'phone_number_fb',
    'fb_phone',
    // International
    'intl_phone',
    'international_phone',
  ],

  // -------------------------------------------------------------------------
  // COMPANY / ORGANIZATION
  // -------------------------------------------------------------------------
  company: [
    // French
    'entreprise',
    'societe',
    'société',
    'ste',
    'sté',
    'raison_sociale',
    'raison sociale',
    'nom_entreprise',
    'nom entreprise',
    'nom_societe',
    'nom_société',
    'societe_nom',
    'entreprise_nom',
    'compagnie',
    'cie',
    'etablissement',
    'établissement',
    // English
    'company',
    'company_name',
    'companyname',
    'company name',
    'organization',
    'organisation',
    'org',
    'org_name',
    'organization_name',
    'business',
    'business_name',
    'businessname',
    'firm',
    'firm_name',
    'employer',
    'employer_name',
    'workplace',
    // CRM formats
    'account_name',
    'accountname',
    'account',
    'lead_company',
    'contact_company',
    'customer_company',
    'associated_company',
    // Facebook Lead Ads
    'company_name_fb',
    'work_company',
  ],

  // -------------------------------------------------------------------------
  // JOB TITLE / POSITION
  // -------------------------------------------------------------------------
  job_title: [
    // French
    'fonction',
    'poste',
    'titre',
    'titre_poste',
    'intitule_poste',
    'intitulé_poste',
    'intitulé poste',
    'intitule_fonction',
    'titre_fonction',
    'metier',
    'métier',
    'profession',
    'activite',
    'activité',
    'qualite',
    'qualité',
    'role_professionnel',
    // English
    'job_title',
    'jobtitle',
    'job title',
    'job',
    'title',
    'role',
    'position',
    'designation',
    'occupation',
    'work_title',
    'professional_title',
    'business_title',
    // CRM formats
    'contact_title',
    'lead_title',
    'person_title',
    // Facebook Lead Ads
    'job_title_fb',
    'work_position',
  ],

  // -------------------------------------------------------------------------
  // ADDRESS
  // -------------------------------------------------------------------------
  address: [
    // French
    'adresse',
    'adresse_postale',
    'adresse postale',
    'adresse_complete',
    'adresse complète',
    'adresse_1',
    'adresse1',
    'ligne_adresse',
    'ligne_adresse_1',
    'rue',
    'voie',
    'numero_rue',
    'numero_voie',
    'no_rue',
    'n_rue',
    'adresse_rue',
    // English
    'address',
    'address_line',
    'address_line_1',
    'addressline1',
    'address_1',
    'address1',
    'street',
    'street_address',
    'streetaddress',
    'street_name',
    'street_line',
    'full_address',
    'fulladdress',
    'mailing_address',
    'billing_address',
    'shipping_address',
    'location',
    'location_address',
    // CRM formats
    'contact_address',
    'lead_address',
    'customer_address',
    // Multi-line
    'address_line_2',
    'address_2',
    'address2',
    'adresse_2',
    'adresse2',
    'complement_adresse',
    'complément_adresse',
    // Facebook Lead Ads
    'street_address_fb',
  ],

  // -------------------------------------------------------------------------
  // CITY
  // -------------------------------------------------------------------------
  city: [
    // French
    'ville',
    'commune',
    'localite',
    'localité',
    'cité',
    'cite',
    'nom_ville',
    'ville_nom',
    'agglomeration',
    'agglomération',
    // English
    'city',
    'city_name',
    'cityname',
    'town',
    'township',
    'municipality',
    'metro',
    'metro_area',
    'urban_area',
    // CRM formats
    'billing_city',
    'shipping_city',
    'mailing_city',
    'contact_city',
    // Facebook Lead Ads
    'city_fb',
  ],

  // -------------------------------------------------------------------------
  // POSTAL CODE
  // -------------------------------------------------------------------------
  postal_code: [
    // French
    'code_postal',
    'code postal',
    'codepostal',
    'cp',
    'c_p',
    'c.p.',
    'code',
    'npa', // Swiss
    'cedex',
    // English
    'postal_code',
    'postalcode',
    'postal code',
    'postcode',
    'post_code',
    'zip',
    'zipcode',
    'zip_code',
    'zip code',
    // CRM formats
    'billing_postal_code',
    'billing_zip',
    'shipping_postal_code',
    'shipping_zip',
    'mailing_zip',
    'contact_zip',
    // Facebook Lead Ads
    'zip_code_fb',
    'postal_code_fb',
  ],

  // -------------------------------------------------------------------------
  // COUNTRY
  // -------------------------------------------------------------------------
  country: [
    // French
    'pays',
    'nation',
    'territoire',
    'code_pays',
    'pays_code',
    // English
    'country',
    'country_name',
    'countryname',
    'country_code',
    'countrycode',
    'nation_name',
    'region',
    'country_region',
    // CRM formats
    'billing_country',
    'shipping_country',
    'mailing_country',
    'contact_country',
    // ISO codes
    'iso_country',
    'country_iso',
    // Facebook Lead Ads
    'country_fb',
  ],

  // -------------------------------------------------------------------------
  // STATUS
  // -------------------------------------------------------------------------
  status: [
    // French
    'statut',
    'etat',
    'état',
    'statut_lead',
    'statut_prospect',
    'statut_client',
    'statut_contact',
    'etat_lead',
    'etat_prospect',
    'phase',
    'etape',
    'étape',
    'avancement',
    'progression',
    'qualification',
    // English
    'status',
    'state',
    'lead_status',
    'leadstatus',
    'lead_state',
    'contact_status',
    'customer_status',
    'prospect_status',
    'lifecycle_stage',
    'lifecyclestage',
    'stage',
    'pipeline_stage',
    'deal_stage',
    'sales_stage',
    'funnel_stage',
    // CRM formats
    'hs_lead_status',
    'sf_lead_status',
    'lead_stage',
    'opportunity_stage',
  ],

  // -------------------------------------------------------------------------
  // SOURCE / ORIGIN
  // -------------------------------------------------------------------------
  source: [
    // French
    'source',
    'origine',
    'provenance',
    'canal',
    'canal_acquisition',
    'source_lead',
    'source_prospect',
    'origine_lead',
    'origine_prospect',
    'moyen_acquisition',
    'support',
    'media',
    'média',
    // English
    'lead_source',
    'leadsource',
    'lead source',
    'original_source',
    'originalsource',
    'channel',
    'acquisition_channel',
    'marketing_channel',
    'source_channel',
    'traffic_source',
    // Campaign
    'campaign',
    'campagne',
    'campaign_name',
    'campaignname',
    'nom_campagne',
    'utm_campaign',
    // UTM parameters
    'utm_source',
    'utm_medium',
    'utm_content',
    'utm_term',
    // Platform specific
    'form_name',
    'formname',
    'platform',
    'plateforme',
    'ad_name',
    'adname',
    'adset_name',
    'adset',
    'ad_id',
    'adid',
    // CRM formats
    'hs_analytics_source',
    'sf_lead_source',
    'first_touch_source',
    'last_touch_source',
    // Facebook/Meta
    'fb_form_name',
    'fb_campaign',
    'facebook_form',
    'meta_form',
    // Google
    'google_campaign',
    'google_ads_campaign',
    // LinkedIn
    'linkedin_form',
    'linkedin_campaign',
  ],

  // -------------------------------------------------------------------------
  // NOTES / COMMENTS
  // -------------------------------------------------------------------------
  notes: [
    // French
    'notes',
    'note',
    'commentaire',
    'commentaires',
    'remarque',
    'remarques',
    'observation',
    'observations',
    'annotation',
    'annotations',
    'memo',
    'mémo',
    'message',
    'messages',
    'texte',
    'texte_libre',
    'champ_libre',
    'informations',
    'infos',
    'details',
    'détails',
    'complement',
    'complément',
    'precision',
    'précision',
    'precisions',
    'précisions',
    // English
    'comment',
    'comments',
    'description',
    'desc',
    'info',
    'information',
    'additional_info',
    'additional_information',
    'extra_info',
    'other_info',
    'remarks',
    'remark',
    'feedback',
    'internal_notes',
    'lead_notes',
    'contact_notes',
    'customer_notes',
    // Form fields
    'free_text',
    'freetext',
    'open_text',
    'custom_message',
    'user_message',
    'inquiry',
    'enquiry',
    'question',
    'questions',
    'request',
    'demande',
    // CRM formats
    'hs_content',
    'sf_description',
  ],

  // -------------------------------------------------------------------------
  // ASSIGNMENT / OWNER
  // -------------------------------------------------------------------------
  assigned_to: [
    // French
    'commercial',
    'commerciaux',
    'vendeur',
    'vendeuse',
    'conseiller',
    'conseillère',
    'gestionnaire',
    'responsable',
    'responsable_commercial',
    'charge_affaires',
    'chargé_affaires',
    'chargé d\'affaires',
    'charge_clientele',
    'chargé_clientèle',
    'referent',
    'référent',
    'assigné',
    'assigne',
    'assigné_à',
    'assigne_a',
    'attribue',
    'attribué',
    'attribue_a',
    'attribué_à',
    'affecte',
    'affecté',
    'affecte_a',
    'affecté_à',
    'proprietaire',
    'propriétaire',
    // English
    'assigned_to',
    'assignedto',
    'assigned',
    'assigned to',
    'assignee',
    'owner',
    'lead_owner',
    'leadowner',
    'contact_owner',
    'contactowner',
    'account_owner',
    'accountowner',
    'record_owner',
    'sales_rep',
    'salesrep',
    'sales rep',
    'sales_representative',
    'rep',
    'representative',
    'agent',
    'sales_agent',
    'salesperson',
    'sales_person',
    'team_member',
    'user',
    'user_id',
    'owner_id',
    'owner_name',
    // CRM formats
    'hs_owner',
    'hubspot_owner',
    'sf_owner',
    'salesforce_owner',
    'assigned_user',
    'assigned_agent',
  ],

  // -------------------------------------------------------------------------
  // DATE FIELDS
  // -------------------------------------------------------------------------
  created_at: [
    // French
    'date_creation',
    'date_de_creation',
    'date de création',
    'date_création',
    'créé_le',
    'cree_le',
    'créé le',
    'cree le',
    'creation',
    'création',
    'date_ajout',
    'date ajout',
    'ajouté_le',
    'ajoute_le',
    'date_inscription',
    'inscrit_le',
    'enregistré_le',
    'enregistre_le',
    // English
    'created_at',
    'createdat',
    'created',
    'created_date',
    'createddate',
    'creation_date',
    'creationdate',
    'date_created',
    'datecreated',
    'create_date',
    'add_date',
    'added_date',
    'added_at',
    'registration_date',
    'signup_date',
    'signup_at',
    // CRM formats
    'hs_createdate',
    'sf_created_date',
    'createdon',
    'record_created',
    'lead_created',
    'contact_created',
    // Timestamps
    'timestamp',
    'ts',
    'datetime',
  ],

  updated_at: [
    // French
    'date_modification',
    'date_de_modification',
    'date de modification',
    'date_modif',
    'modifié_le',
    'modifie_le',
    'modifié le',
    'modifie le',
    'modification',
    'derniere_modification',
    'dernière_modification',
    'dernière modification',
    'maj',
    'mise_a_jour',
    'mise_à_jour',
    'mise à jour',
    'date_maj',
    'date_mise_a_jour',
    // English
    'updated_at',
    'updatedat',
    'updated',
    'updated_date',
    'updateddate',
    'update_date',
    'modification_date',
    'modificationdate',
    'date_updated',
    'dateupdated',
    'date_modified',
    'datemodified',
    'modified_at',
    'modified_date',
    'modifieddate',
    'last_modified',
    'lastmodified',
    'last_updated',
    'lastupdated',
    'last_update',
    'lastupdate',
    'change_date',
    'changed_at',
    // CRM formats
    'hs_lastmodifieddate',
    'sf_last_modified_date',
    'modifiedon',
    'updatedon',
    'record_updated',
    'lead_updated',
    'contact_updated',
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
 * Split a header into words for word-based matching
 */
function splitIntoWords(normalized: string): string[] {
  return normalized.split('_').filter((w) => w.length > 0);
}

/**
 * Check if header ends with a number suffix (e.g., email_1, phone_2)
 * Returns the base name without the number
 */
function removeNumberSuffix(normalized: string): string {
  return normalized.replace(/_?\d+$/, '');
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

  // Check without number suffix (email_1 should match email)
  const s1Base = removeNumberSuffix(s1);
  const s2Base = removeNumberSuffix(s2);
  if (s1Base === s2Base && s1Base.length > 2) {
    return 0.95;
  }

  // Check if one is a prefix/suffix with common separators
  // e.g., "client_email" should match "email" with high confidence
  const s1Words = splitIntoWords(s1);
  const s2Words = splitIntoWords(s2);

  // If the shorter one is a complete word in the longer one
  if (s1Words.length === 1 && s2Words.includes(s1)) {
    return 0.92;
  }
  if (s2Words.length === 1 && s1Words.includes(s2)) {
    return 0.92;
  }

  // Check if one contains the other (substring match)
  if (s1.includes(s2) || s2.includes(s1)) {
    // Give higher score if the match is a significant portion
    const shorter = s1.length < s2.length ? s1 : s2;
    const longer = s1.length < s2.length ? s2 : s1;
    const ratio = shorter.length / longer.length;
    return 0.85 + ratio * 0.1; // 0.85 to 0.95 based on length ratio
  }

  // Check word overlap (e.g., "telephone_principal" vs "telephone")
  const commonWords = s1Words.filter((w) => s2Words.includes(w));
  if (commonWords.length > 0) {
    const overlapRatio =
      commonWords.length / Math.min(s1Words.length, s2Words.length);
    if (overlapRatio >= 0.5) {
      return 0.8 + overlapRatio * 0.1;
    }
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
 * Check if header starts with common prefixes that should be stripped
 */
const COMMON_PREFIXES = [
  'lead_',
  'contact_',
  'customer_',
  'client_',
  'prospect_',
  'person_',
  'user_',
  'account_',
  'main_',
  'primary_',
  'billing_',
  'shipping_',
  'mailing_',
  'work_',
  'home_',
  'business_',
  'personal_',
];

/**
 * Check if header ends with common suffixes that should be stripped
 */
const COMMON_SUFFIXES = [
  '_address',
  '_name',
  '_number',
  '_field',
  '_value',
  '_info',
  '_data',
  '_fb',
  '_1',
  '_2',
  '_principal',
  '_principale',
];

/**
 * Strip common prefixes/suffixes from header for better matching
 */
function stripPrefixesSuffixes(normalized: string): string {
  let result = normalized;

  // Strip prefixes
  for (const prefix of COMMON_PREFIXES) {
    if (result.startsWith(prefix) && result.length > prefix.length) {
      result = result.slice(prefix.length);
      break;
    }
  }

  // Strip suffixes
  for (const suffix of COMMON_SUFFIXES) {
    if (result.endsWith(suffix) && result.length > suffix.length) {
      result = result.slice(0, -suffix.length);
      break;
    }
  }

  return result;
}

/**
 * Find the best matching field for a given column header
 * Returns the field key and confidence score
 *
 * Matching strategies (in order of priority):
 * 1. Exact match after normalization → 1.0
 * 2. Exact match after stripping prefixes/suffixes → 0.95
 * 3. Number suffix stripped match → 0.95
 * 4. Word-in-header match → 0.92
 * 5. Substring match → 0.85-0.95
 * 6. Word overlap match → 0.80-0.90
 * 7. Levenshtein similarity → varies
 */
export function findBestMatch(
  header: string
): { field: LeadFieldKey | null; confidence: number } {
  const normalizedHeader = normalizeHeader(header);
  const strippedHeader = stripPrefixesSuffixes(normalizedHeader);
  let bestMatch: LeadFieldKey | null = null;
  let bestScore = 0;

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const normalizedAlias = normalizeHeader(alias);

      // Strategy 1: Exact match
      if (normalizedHeader === normalizedAlias) {
        return { field: field as LeadFieldKey, confidence: 1 };
      }

      // Strategy 2: Match after stripping prefixes/suffixes
      const strippedAlias = stripPrefixesSuffixes(normalizedAlias);
      if (
        strippedHeader === strippedAlias &&
        strippedHeader.length >= 3
      ) {
        if (bestScore < 0.95) {
          bestScore = 0.95;
          bestMatch = field as LeadFieldKey;
        }
        continue;
      }

      // Strategy 3-7: Similarity-based matching
      const score = calculateSimilarity(normalizedHeader, normalizedAlias);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = field as LeadFieldKey;
      }

      // Also try matching with stripped versions
      if (strippedHeader !== normalizedHeader) {
        const strippedScore = calculateSimilarity(strippedHeader, normalizedAlias);
        if (strippedScore > bestScore) {
          bestScore = strippedScore * 0.98; // Slight penalty for needing to strip
          bestMatch = field as LeadFieldKey;
        }
      }
    }
  }

  return { field: bestMatch, confidence: bestScore };
}
