/**
 * Centralized Icon Size Constants (DRY)
 * Standard sizes for Tabler icons across the app
 *
 * Used across: all modules with icons
 */

export const ICON_SIZE = {
  /** Extra small - 14px: Chevrons, checkmarks in dropdowns */
  XS: 14,

  /** Small - 16px: Form actions, filters, inline icons */
  SM: 16,

  /** Medium - 18px: Button icons, action buttons */
  MD: 18,

  /** Large - 20px: Modal titles, section headers */
  LG: 20,

  /** Extra large - 24px: Avatar overlays, large actions */
  XL: 24,

  /** Extra extra large - 32px: Success/error indicators, empty states */
  XXL: 32,
} as const;

export type IconSize = (typeof ICON_SIZE)[keyof typeof ICON_SIZE];
