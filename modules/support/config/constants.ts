import {
  IconBug,
  IconSparkles,
  IconCreditCard,
  IconMessageCircle,
} from '@tabler/icons-react';
import type { ComponentType } from 'react';
import type { SupportTicketCategory, SupportTicketStatus } from '@/db/types';

// Ticket category labels in French
export const TICKET_CATEGORY_LABELS: Record<SupportTicketCategory, string> = {
  bug: 'Bug',
  feature: 'Fonctionnalité',
  payment_issue: 'Problème de paiement',
  feedback: 'Commentaire',
};

// Ticket category icons
export const TICKET_CATEGORY_ICONS: Record<
  SupportTicketCategory,
  ComponentType<{ size?: number; className?: string }>
> = {
  bug: IconBug,
  feature: IconSparkles,
  payment_issue: IconCreditCard,
  feedback: IconMessageCircle,
};

// Ticket status labels in French
export const TICKET_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
};

// Ticket status colors for badges
export const TICKET_STATUS_COLORS: Record<
  SupportTicketStatus,
  'success' | 'warning' | 'error' | 'info' | 'secondary'
> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'secondary',
};

// Category options for select dropdown
export const TICKET_CATEGORY_OPTIONS: Array<{
  value: SupportTicketCategory;
  label: string;
}> = [
  { value: 'bug', label: TICKET_CATEGORY_LABELS.bug },
  { value: 'feature', label: TICKET_CATEGORY_LABELS.feature },
  { value: 'payment_issue', label: TICKET_CATEGORY_LABELS.payment_issue },
  { value: 'feedback', label: TICKET_CATEGORY_LABELS.feedback },
];

// Status options for select dropdown
export const TICKET_STATUS_OPTIONS: Array<{
  value: SupportTicketStatus;
  label: string;
}> = [
  { value: 'open', label: TICKET_STATUS_LABELS.open },
  { value: 'in_progress', label: TICKET_STATUS_LABELS.in_progress },
  { value: 'resolved', label: TICKET_STATUS_LABELS.resolved },
  { value: 'closed', label: TICKET_STATUS_LABELS.closed },
];
