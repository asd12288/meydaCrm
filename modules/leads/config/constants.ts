import type { LeadStatus } from '@/db/types';

// Status colors mapping to globals.css badge classes
export const STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'badge-primary',
  contacted: 'badge-info',
  qualified: 'badge-secondary',
  proposal: 'badge-warning',
  negotiation: 'badge-warning',
  won: 'badge-success',
  lost: 'badge-error',
  no_answer: 'badge-error',
};

// Status options for dropdowns (French labels)
export const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'Nouveau' },
  { value: 'contacted', label: 'Contacte' },
  { value: 'qualified', label: 'Qualifie' },
  { value: 'proposal', label: 'Proposition envoyee' },
  { value: 'negotiation', label: 'Negociation' },
  { value: 'won', label: 'Gagne' },
  { value: 'lost', label: 'Perdu' },
  { value: 'no_answer', label: 'Pas de reponse' },
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
