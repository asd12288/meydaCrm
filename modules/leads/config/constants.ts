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

// Import centralized color constants
import {
  STATUS_BADGE_CLASSES,
  BADGE_TO_CSS_VAR,
} from '@/lib/constants';

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

// Re-export centralized constants for backwards compatibility
export const BADGE_TO_COLOR = BADGE_TO_CSS_VAR;
export const STATUS_COLORS = STATUS_BADGE_CLASSES;

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
import type { KanbanBoardCircleColor } from '../components/kanban/board-primitives';

export const KANBAN_COLUMNS: {
  status: LeadStatus;
  label: string;
  color: KanbanBoardCircleColor;
}[] = [
  { status: 'new', label: 'Nouveau', color: 'indigo' },         // Indigo - Fresh leads
  { status: 'callback', label: 'Rappeler', color: 'cyan' },     // Cyan - Scheduled action
  { status: 'relance', label: 'Relance', color: 'blue' },       // Blue - Follow-up needed
  { status: 'no_answer_1', label: 'Pas de réponse 1', color: 'yellow' }, // Yellow - First attempt
  { status: 'no_answer_2', label: 'Pas de réponse 2', color: 'orange' }, // Orange - Second attempt
  { status: 'mail', label: 'Mail', color: 'purple' },           // Purple - Email contact
  { status: 'rdv', label: 'RDV', color: 'green' },              // Green - Meeting scheduled
  { status: 'deposit', label: 'Dépôt', color: 'emerald' },      // Emerald - Won/money
  { status: 'not_interested', label: 'Pas intéressé', color: 'red' }, // Red - Negative outcome
  { status: 'wrong_number', label: 'Faux numéro', color: 'gray' }, // Gray - Invalid/dead end
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
  status: 'Statut',
  assignee: 'Commercial',
  createdAt: 'Ajouté le',
  updatedAt: 'Mis à jour',
  notes: 'Description',
  actions: '',
};
