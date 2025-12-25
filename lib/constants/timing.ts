/**
 * Centralized Timing Constants (DRY)
 * Delays, debounce values, and animation durations
 *
 * Used across: forms, animations, UI interactions
 */

export const TIMING = {
  // ============================================
  // Form success delays (milliseconds)
  // ============================================

  /** Default success delay before closing modal/redirect */
  SUCCESS_DELAY_DEFAULT: 1000,

  /** Password reset success delay (longer for security message) */
  SUCCESS_DELAY_PASSWORD: 1500,

  /** Quick success delay (meeting forms, etc.) */
  SUCCESS_DELAY_QUICK: 500,

  // ============================================
  // Animation delays (milliseconds)
  // ============================================

  /** Clear upload progress indicator */
  UPLOAD_PROGRESS_CLEAR: 500,

  /** Kanban card drop animation */
  KANBAN_DROP_ANIMATION: 250,

  /** Column pulse animation (when item added) */
  COLUMN_PULSE_ANIMATION: 300,

  /** Focus delay (immediate with setTimeout for next tick) */
  FOCUS_DELAY: 0,

  // ============================================
  // Debounce values (milliseconds)
  // ============================================

  /** Search input debounce */
  SEARCH_DEBOUNCE: 300,
} as const;

export type TimingValue = (typeof TIMING)[keyof typeof TIMING];
