/**
 * Notification configuration constants
 * French labels, icons, and colors for each notification type
 */

import {
  IconBell,
  IconUserCheck,
  IconMessage,
  IconCheck,
  IconX,
  IconTicket,
  IconAlertTriangle,
} from '@tabler/icons-react';
import type { NotificationType } from '../types';

/**
 * Notification type configurations
 */
export const NOTIFICATION_TYPES: Record<
  NotificationType,
  {
    label: string; // French label
    icon: typeof IconBell;
    color: string; // Badge color class
  }
> = {
  lead_assigned: {
    label: 'Lead assigné',
    icon: IconUserCheck,
    color: 'badge-primary',
  },
  lead_comment: {
    label: 'Commentaire',
    icon: IconMessage,
    color: 'badge-secondary',
  },
  import_completed: {
    label: 'Import terminé',
    icon: IconCheck,
    color: 'badge-success',
  },
  import_failed: {
    label: 'Import échoué',
    icon: IconX,
    color: 'badge-error',
  },
  support_ticket: {
    label: 'Ticket support',
    icon: IconTicket,
    color: 'badge-info',
  },
  subscription_warning: {
    label: 'Alerte abonnement',
    icon: IconAlertTriangle,
    color: 'badge-warning',
  },
};

/**
 * Get icon for notification type
 */
export function getNotificationIcon(type: NotificationType) {
  return NOTIFICATION_TYPES[type]?.icon || IconBell;
}

/**
 * Get color class for notification type
 */
export function getNotificationColor(type: NotificationType): string {
  return NOTIFICATION_TYPES[type]?.color || 'badge-secondary';
}

/**
 * Get label for notification type
 */
export function getNotificationLabel(type: NotificationType): string {
  return NOTIFICATION_TYPES[type]?.label || type;
}


