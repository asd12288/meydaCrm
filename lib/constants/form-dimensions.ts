/**
 * Centralized Form Dimension Constants (DRY)
 * Standard sizes for form elements
 *
 * Used across: all modules with forms
 */

/**
 * Standard textarea row counts
 */
export const TEXTAREA_ROWS = {
  /** Single line textarea (inline editing) */
  SINGLE_LINE: 1,

  /** Comment input fields */
  COMMENT: 2,

  /** Meeting notes */
  MEETING_NOTES: 3,

  /** Lead notes, banner content */
  LEAD_NOTES: 4,
  BANNER_CONTENT: 4,

  /** Note content, support tickets */
  NOTE_CONTENT: 6,
  SUPPORT_TICKET: 6,
} as const;

export type TextareaRowCount = (typeof TEXTAREA_ROWS)[keyof typeof TEXTAREA_ROWS];
