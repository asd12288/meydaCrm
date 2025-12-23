// Components
export { NotificationBell } from './components/notification-bell';
export { NotificationDropdown } from './components/notification-dropdown';
export { NotificationItem } from './components/notification-item';
export { NotificationSkeleton, NotificationSkeletons } from './components/notification-skeleton';

// Hooks
export { useNotifications } from './hooks/use-notifications';

// Actions
export {
  createNotification,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
} from './lib/actions';

// Helpers
export {
  createNotificationForUser,
  createNotificationForUsers,
  notifyLeadAssigned,
  notifyBulkLeadsTransferred,
  notifyLeadComment,
  notifyImportCompleted,
  notifyImportFailed,
  notifySupportTicket,
  notifySubscriptionWarning,
} from './lib/create-notification';

// Types
export type {
  Notification,
  NotificationType,
  NotificationMetadata,
  NotificationWithComputed,
  LeadAssignedMetadata,
  LeadCommentMetadata,
  ImportCompletedMetadata,
  ImportFailedMetadata,
  SupportTicketMetadata,
  SubscriptionWarningMetadata,
} from './types';

// Constants
export {
  NOTIFICATION_TYPES,
  getNotificationIcon,
  getNotificationColor,
  getNotificationLabel,
} from './config/constants';
