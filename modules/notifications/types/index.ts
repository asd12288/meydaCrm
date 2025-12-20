/**
 * Notification types and interfaces
 */

export type NotificationType =
  | 'lead_assigned'
  | 'lead_comment'
  | 'import_completed'
  | 'import_failed'
  | 'support_ticket'
  | 'subscription_warning';

/**
 * Base notification interface (matches database schema)
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: NotificationMetadata | null;
  readAt: string | null;
  actionUrl: string | null;
  createdAt: string;
}

/**
 * Notification metadata types per notification type
 */
export interface LeadAssignedMetadata {
  leadId: string;
  leadName?: string;
}

export interface LeadCommentMetadata {
  leadId: string;
  commentId: string;
  leadName?: string;
  commentPreview?: string;
}

export interface ImportCompletedMetadata {
  importJobId: string;
  fileName?: string;
  importedCount?: number;
}

export interface ImportFailedMetadata {
  importJobId: string;
  fileName?: string;
  errorMessage?: string;
}

export interface SupportTicketMetadata {
  ticketId: string;
  ticketSubject?: string;
}

export interface SubscriptionWarningMetadata {
  daysRemaining?: number;
  isGrace?: boolean;
}

/**
 * Union type for all metadata
 */
export type NotificationMetadata =
  | LeadAssignedMetadata
  | LeadCommentMetadata
  | ImportCompletedMetadata
  | ImportFailedMetadata
  | SupportTicketMetadata
  | SubscriptionWarningMetadata;

/**
 * Notification with computed properties
 */
export interface NotificationWithComputed extends Notification {
  isRead: boolean;
  timeAgo: string;
}
