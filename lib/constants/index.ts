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
  LEAD_STATUS_OPTIONS,
  type LeadStatusKey,
  type LeadStatusLabel,
} from './lead-statuses';

// Status colors (centralized)
export {
  STATUS_BADGE_CLASSES,
  BADGE_TO_CSS_VAR,
  BADGE_TO_TEXT_CLASS,
  TEXT_CLASS_TO_CSS_VAR,
  STATUS_CHART_COLORS,
  getStatusBadgeClass,
  getStatusCssVar,
  getStatusTextClass,
  getStatusChartColor,
  getTextClassCssVar,
} from './status-colors';

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

// Toast messages
export { TOAST, type ToastMessageKey } from './toast-messages';

// Icon sizes
export { ICON_SIZE, type IconSize } from './icon-sizes';

// Form dimensions
export { TEXTAREA_ROWS, type TextareaRowCount } from './form-dimensions';

// Display limits
export { DISPLAY_LIMITS, type DisplayLimit } from './display-limits';

// Timing
export { TIMING, type TimingValue } from './timing';
