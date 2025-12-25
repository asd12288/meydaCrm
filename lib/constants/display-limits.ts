/**
 * Centralized Display Limit Constants (DRY)
 * Limits for slicing/truncating data in UI
 *
 * Used across: dashboard, import, leads modules
 */

export const DISPLAY_LIMITS = {
  // ============================================
  // Dashboard widgets
  // ============================================

  /** Number of leads shown in stats card */
  LEADS_STATS_CARD: 6,

  /** Top performers in chart */
  TOP_PERFORMERS: 5,

  /** Team members in distribution chart */
  TOP_TEAM_MEMBERS: 8,

  /** Recent activities in feed */
  RECENT_ACTIVITIES: 6,

  /** Recent imports in table */
  RECENT_IMPORTS: 5,

  /** Status distribution items */
  STATUS_DISTRIBUTION: 6,

  // ============================================
  // Import/mapping
  // ============================================

  /** Sample rows shown in preview */
  SAMPLE_ROWS_PREVIEW: 5,

  /** Sample values per mapping field */
  MAPPING_SAMPLE_VALUES: 3,

  /** Alternative mapping suggestions */
  MAPPING_ALTERNATIVES: 3,

  /** Maximum rows shown in import preview */
  IMPORT_ROWS_PREVIEW: 30,

  /** Lines for parser type detection */
  PARSER_SAMPLE_LINES: 5,

  // ============================================
  // Field display
  // ============================================

  /** Changed fields shown in history */
  CHANGED_FIELDS: 5,

  /** Sample value string length */
  VALUE_SAMPLE_LENGTH: 50,

  /** Long value truncation */
  TRUNCATE_LONG_VALUES: 100,

  // ============================================
  // File processing
  // ============================================

  /** Bytes to read for file type detection */
  FILE_TYPE_DETECTION_BYTES: 8192,
} as const;

export type DisplayLimit = (typeof DISPLAY_LIMITS)[keyof typeof DISPLAY_LIMITS];
