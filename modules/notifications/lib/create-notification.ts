/**
 * Helper functions to create notifications for users
 * Used by other modules (leads, imports, support, etc.)
 */

import { createNotification } from './actions';
import type { NotificationType, NotificationMetadata } from '../types';

/**
 * Create a notification for a user
 * This is the main entry point for creating notifications from other modules
 */
export async function createNotificationForUser(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: NotificationMetadata | null,
  actionUrl?: string | null
): Promise<{ success?: boolean; error?: string }> {
  const result = await createNotification(
    userId,
    type,
    title,
    message,
    metadata,
    actionUrl
  );

  if (result.error) {
    console.error(`[Notifications] Failed to create ${type} notification:`, result.error);
    // Don't throw - notifications are non-critical
  }

  return result;
}

/**
 * Create notification for multiple users
 */
export async function createNotificationForUsers(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  metadata?: NotificationMetadata | null,
  actionUrl?: string | null
): Promise<{ success: number; errors: number }> {
  let success = 0;
  let errors = 0;

  await Promise.all(
    userIds.map(async (userId) => {
      const result = await createNotificationForUser(
        userId,
        type,
        title,
        message,
        metadata,
        actionUrl
      );
      if (result.success) {
        success++;
      } else {
        errors++;
      }
    })
  );

  return { success, errors };
}

/**
 * Helper to create lead assigned notification
 */
export async function notifyLeadAssigned(
  userId: string,
  leadId: string,
  leadName?: string
): Promise<void> {
  const title = 'Nouveau lead assigné';
  const message = leadName
    ? `Le lead "${leadName}" vous a été assigné`
    : 'Un nouveau lead vous a été assigné';
  const metadata = { leadId, leadName };
  const actionUrl = `/leads/${leadId}`;

  await createNotificationForUser(userId, 'lead_assigned', title, message, metadata, actionUrl);
}

/**
 * Helper to create lead comment notification
 */
export async function notifyLeadComment(
  userId: string,
  leadId: string,
  commentId: string,
  leadName?: string,
  commentPreview?: string
): Promise<void> {
  const title = 'Nouveau commentaire';
  const message = leadName
    ? `Nouveau commentaire sur le lead "${leadName}"`
    : 'Nouveau commentaire sur votre lead';
  const metadata = { leadId, commentId, leadName, commentPreview };
  const actionUrl = `/leads/${leadId}`;

  await createNotificationForUser(
    userId,
    'lead_comment',
    title,
    message,
    metadata,
    actionUrl
  );
}

/**
 * Helper to create import completed notification
 */
export async function notifyImportCompleted(
  userId: string,
  importJobId: string,
  fileName?: string,
  importedCount?: number
): Promise<void> {
  const title = 'Import terminé';
  const message =
    importedCount !== undefined
      ? `Import de "${fileName || 'fichier'}" terminé: ${importedCount} leads importés`
      : `Import de "${fileName || 'fichier'}" terminé avec succès`;
  const metadata = { importJobId, fileName, importedCount };
  const actionUrl = '/import/history';

  await createNotificationForUser(
    userId,
    'import_completed',
    title,
    message,
    metadata,
    actionUrl
  );
}

/**
 * Helper to create import failed notification
 */
export async function notifyImportFailed(
  userId: string,
  importJobId: string,
  fileName?: string,
  errorMessage?: string
): Promise<void> {
  const title = 'Import échoué';
  const message = errorMessage
    ? `L'import de "${fileName || 'fichier'}" a échoué: ${errorMessage}`
    : `L'import de "${fileName || 'fichier'}" a échoué`;
  const metadata = { importJobId, fileName, errorMessage };
  const actionUrl = '/import/history';

  await createNotificationForUser(
    userId,
    'import_failed',
    title,
    message,
    metadata,
    actionUrl
  );
}

/**
 * Helper to create support ticket notification
 */
export async function notifySupportTicket(
  userId: string,
  ticketId: string,
  ticketSubject?: string
): Promise<void> {
  const title = 'Ticket support';
  const message = ticketSubject
    ? `Mise à jour sur le ticket: "${ticketSubject}"`
    : 'Mise à jour sur votre ticket support';
  const metadata = { ticketId, ticketSubject };
  const actionUrl = `/support?ticket=${ticketId}`;

  await createNotificationForUser(
    userId,
    'support_ticket',
    title,
    message,
    metadata,
    actionUrl
  );
}

/**
 * Helper to create subscription warning notification
 */
export async function notifySubscriptionWarning(
  userId: string,
  daysRemaining?: number,
  isGrace?: boolean
): Promise<void> {
  let title: string;
  let message: string;

  if (isGrace) {
    title = 'Alerte abonnement';
    message = daysRemaining === 1
      ? 'DERNIER JOUR! Votre abonnement a expiré. Votre accès sera bloqué demain.'
      : `Votre abonnement a expiré! Il vous reste ${daysRemaining || 0} jours pour renouveler.`;
  } else {
    title = 'Alerte abonnement';
    message =
      daysRemaining === 0
        ? "Votre abonnement expire aujourd'hui."
        : daysRemaining === 1
        ? 'Votre abonnement expire demain.'
        : `Votre abonnement expire dans ${daysRemaining} jours.`;
  }

  const metadata = { daysRemaining, isGrace };
  const actionUrl = '/subscription';

  await createNotificationForUser(
    userId,
    'subscription_warning',
    title,
    message,
    metadata,
    actionUrl
  );
}
