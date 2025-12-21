import type { LeadStatus } from '@/db/types';
import {
  IconCalendarEvent,
  IconPhoneOff,
  IconPhoneX,
  IconBan,
  IconThumbDown,
  IconCash,
  IconPhoneCall,
  IconRefresh,
  IconMail,
  IconSparkles,
} from '@tabler/icons-react';

// Map status to icon component
export const STATUS_ICON_MAP: Record<
  string,
  React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>
> = {
  new: IconSparkles,
  rdv: IconCalendarEvent,
  no_answer_1: IconPhoneOff,
  no_answer_2: IconPhoneX,
  wrong_number: IconBan,
  not_interested: IconThumbDown,
  deposit: IconCash,
  callback: IconPhoneCall,
  relance: IconRefresh,
  mail: IconMail,
};

// Map badge classes to CSS color values for inline styles
export const BADGE_TO_COLOR: Record<string, string> = {
  'badge-success': 'var(--color-success)',
  'badge-warning': 'var(--color-warning)',
  'badge-error': 'var(--color-error)',
  'badge-info': 'var(--color-info)',
  'badge-primary': 'var(--color-primary)',
  'badge-secondary': 'var(--color-secondary)',
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

// Status options for dropdowns (French labels) - ALL ACTIVE STATUSES
export const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'Nouveau' },
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

// Kanban column configuration (order reflects sales workflow)
// Colors map to KanbanBoardCircleColor from shadcn-kanban-board
import type { KanbanBoardCircleColor } from '@/components/kanban';

export const KANBAN_COLUMNS: {
  status: LeadStatus;
  label: string;
  color: KanbanBoardCircleColor;
}[] = [
  { status: 'new', label: 'Nouveau', color: 'primary' },
  { status: 'callback', label: 'Rappeler', color: 'cyan' },
  { status: 'relance', label: 'Relance', color: 'blue' },
  { status: 'no_answer_1', label: 'Pas de réponse 1', color: 'yellow' },
  { status: 'no_answer_2', label: 'Pas de réponse 2', color: 'red' },
  { status: 'mail', label: 'Mail', color: 'purple' },
  { status: 'rdv', label: 'RDV', color: 'green' },
  { status: 'deposit', label: 'Dépôt', color: 'green' },
  { status: 'not_interested', label: 'Pas intéressé', color: 'gray' },
  { status: 'wrong_number', label: 'Faux numéro', color: 'gray' },
];

// Kanban page size (show more leads per column for better overview)
export const KANBAN_PAGE_SIZE = 200;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [20, 50, 100];

// Search debounce delay in milliseconds
export const SEARCH_DEBOUNCE_MS = 300;

// Minimum characters required for search (performance optimization for 290k+ leads)
export const MIN_SEARCH_LENGTH = 3;

// Table column labels (French)
export const COLUMN_LABELS = {
  selection: '',
  name: 'Nom',
  email: 'Email',
  phone: 'Téléphone',
  company: 'Entreprise',
  status: 'Statut',
  assignee: 'Commercial',
  updatedAt: 'Mis à jour',
  actions: '',
};
