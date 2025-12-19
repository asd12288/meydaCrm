import type { LeadStatus } from '@/db/types';

// Status icon names (from @tabler/icons-react)
export const STATUS_ICONS: Record<LeadStatus, string> = {
  rdv: 'IconCalendarEvent',
  no_answer_1: 'IconPhoneOff',
  no_answer_2: 'IconPhoneX',
  wrong_number: 'IconBan',
  not_interested: 'IconThumbDown',
  deposit: 'IconCash',
  callback: 'IconPhoneCall',
  relance: 'IconRefresh',
  mail: 'IconMail',
  // Legacy statuses (keep for compatibility)
  new: 'IconSparkles',
  contacted: 'IconPhone',
  qualified: 'IconCheck',
  proposal: 'IconFileText',
  negotiation: 'IconMessages',
  won: 'IconTrophy',
  lost: 'IconX',
  no_answer: 'IconPhoneOff',
};

// Status colors mapping to globals.css badge classes
export const STATUS_COLORS: Record<LeadStatus, string> = {
  rdv: 'badge-success',
  no_answer_1: 'badge-warning',
  no_answer_2: 'badge-error',
  wrong_number: 'badge-error',
  not_interested: 'badge-error',
  deposit: 'badge-success',
  callback: 'badge-info',
  relance: 'badge-primary',
  mail: 'badge-secondary',
  // Legacy statuses
  new: 'badge-primary',
  contacted: 'badge-info',
  qualified: 'badge-secondary',
  proposal: 'badge-warning',
  negotiation: 'badge-warning',
  won: 'badge-success',
  lost: 'badge-error',
  no_answer: 'badge-error',
};

// Status options for dropdowns (French labels) - NEW STATUSES ONLY
export const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'rdv', label: 'RDV' },
  { value: 'no_answer_1', label: 'Pas de réponse 1' },
  { value: 'no_answer_2', label: 'Pas de réponse 2' },
  { value: 'wrong_number', label: 'Faux numéro' },
  { value: 'not_interested', label: 'Pas intéressé' },
  { value: 'deposit', label: 'Dépôt' },
  { value: 'callback', label: 'Rappeler' },
  { value: 'relance', label: 'Relance' },
  { value: 'mail', label: 'Mail' },
];

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [20, 50, 100];

// Search debounce delay in milliseconds
export const SEARCH_DEBOUNCE_MS = 300;

// Table column labels (French)
export const COLUMN_LABELS = {
  selection: '',
  name: 'Nom',
  email: 'Email',
  phone: 'Telephone',
  company: 'Entreprise',
  status: 'Statut',
  assignee: 'Commercial',
  updatedAt: 'Mis a jour',
  actions: '',
};
