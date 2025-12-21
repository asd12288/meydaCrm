/**
 * Centralized constants exports (DRY)
 * Import from here instead of separate files
 */

// Roles
export {
  ROLES,
  ROLE_LABELS,
  ROLE_OPTIONS,
  USER_ROLE_OPTIONS,
  getRoleLabel,
  type UserRole,
} from './roles';

// Lead fields
export {
  LEAD_FIELD_LABELS,
  getLeadFieldLabel,
  type LeadFieldKey,
} from './lead-fields';

// Lead statuses
export {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_STATUS_OPTIONS,
  getStatusColor,
  type LeadStatus,
} from './lead-statuses';

// History events
export {
  HISTORY_EVENT_TYPES,
  HISTORY_EVENT_LABELS,
  getHistoryEventLabel,
  type HistoryEventType,
} from './history';

// Avatars
export {
  AVATARS,
  AVATAR_IDS,
  AVATAR_COUNT,
  isValidAvatarId,
  getAvatarLabel,
  getAvatarPath,
  getRandomAvatarId,
  type AvatarOption,
} from './avatars';
