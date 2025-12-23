/**
 * Lead Assignment Logic
 *
 * Handles different assignment modes for imported leads:
 * - none: No assignment
 * - round_robin: Distribute across multiple users
 * - by_column: Read assignee from file column
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export type AssignmentMode = 'none' | 'round_robin' | 'by_column';

export interface AssignmentConfig {
  mode: AssignmentMode;
  roundRobinUserIds?: string[];
  assignmentColumn?: string;
}

export interface AssignmentContext {
  config: AssignmentConfig;
  /** Pre-loaded user map for by_column mode */
  userMap: Map<string, string>;
  /** Current index for round_robin */
  roundRobinIndex: number;
}

// ============================================================================
// NORMALIZATION UTILITIES
// ============================================================================

/**
 * Normalize a string for comparison
 * - Lowercase
 * - Remove accents (é → e, ç → c, etc.)
 * - Trim whitespace
 * - Remove extra spaces
 */
function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .trim()
    .replace(/\s+/g, ' '); // Collapse multiple spaces
}

/**
 * Extract first name from full name
 */
function extractFirstName(fullName: string): string {
  const parts = normalizeForComparison(fullName).split(' ');
  return parts[0] || '';
}

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

/**
 * Build assignment context with pre-loaded data
 *
 * For by_column mode, pre-loads all users for fast lookup.
 * Creates multiple lookup keys for flexible matching:
 * - Full display name (normalized)
 * - First name only
 * - User ID (for direct ID references)
 */
export async function buildAssignmentContext(
  supabase: SupabaseClient,
  config: AssignmentConfig
): Promise<AssignmentContext> {
  const userMap = new Map<string, string>();

  // Pre-load users for by_column mode
  if (config.mode === 'by_column') {
    const { data: users } = await supabase
      .from('profiles')
      .select('id, display_name, role');

    if (users) {
      // First pass: add full names (highest priority)
      for (const user of users) {
        if (user.display_name) {
          const normalized = normalizeForComparison(user.display_name);
          userMap.set(normalized, user.id);
        }
        // Also map by ID for direct ID references
        userMap.set(user.id.toLowerCase(), user.id);
      }

      // Second pass: add first names (only if unique, lower priority)
      const firstNameCounts = new Map<string, number>();
      for (const user of users) {
        if (user.display_name) {
          const firstName = extractFirstName(user.display_name);
          firstNameCounts.set(firstName, (firstNameCounts.get(firstName) || 0) + 1);
        }
      }

      for (const user of users) {
        if (user.display_name) {
          const firstName = extractFirstName(user.display_name);
          // Only add first name mapping if it's unique (no ambiguity)
          if (firstNameCounts.get(firstName) === 1 && !userMap.has(firstName)) {
            userMap.set(firstName, user.id);
          }
        }
      }
    }
  }

  return {
    config,
    userMap,
    roundRobinIndex: 0,
  };
}

// ============================================================================
// ASSIGNMENT FUNCTIONS
// ============================================================================

/**
 * Get assigned user for a lead
 *
 * @param context - Assignment context
 * @param rawData - Raw row data (for by_column lookup)
 * @returns User ID or null
 */
export function getAssignment(
  context: AssignmentContext,
  rawData: Record<string, string>
): string | null {
  const { config, userMap } = context;

  switch (config.mode) {
    case 'none':
      return null;

    case 'round_robin': {
      const userIds = config.roundRobinUserIds;
      if (!userIds || userIds.length === 0) {
        return null;
      }
      const userId = userIds[context.roundRobinIndex % userIds.length];
      context.roundRobinIndex++;
      return userId;
    }

    case 'by_column': {
      if (!config.assignmentColumn) {
        return null;
      }
      const rawValue = rawData[config.assignmentColumn];
      if (!rawValue || typeof rawValue !== 'string' || rawValue.trim() === '') {
        return null; // Empty value - leave unassigned
      }
      const normalizedValue = normalizeForComparison(rawValue);
      return userMap.get(normalizedValue) || null;
    }

    default:
      return null;
  }
}

/**
 * Validate assignment configuration
 */
export function validateAssignmentConfig(config: AssignmentConfig): {
  isValid: boolean;
  error?: string;
} {
  switch (config.mode) {
    case 'none':
      return { isValid: true };

    case 'round_robin':
      if (!config.roundRobinUserIds || config.roundRobinUserIds.length === 0) {
        return { isValid: false, error: 'User IDs required for round-robin assignment' };
      }
      return { isValid: true };

    case 'by_column':
      if (!config.assignmentColumn) {
        return { isValid: false, error: 'Column name required for by_column assignment' };
      }
      return { isValid: true };

    default:
      return { isValid: false, error: 'Invalid assignment mode' };
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Track assignment statistics
 */
export interface AssignmentStats {
  total: number;
  assigned: number;
  unassigned: number;
  byUser: Map<string, number>;
}

export function createAssignmentStats(): AssignmentStats {
  return {
    total: 0,
    assigned: 0,
    unassigned: 0,
    byUser: new Map(),
  };
}

export function recordAssignment(
  stats: AssignmentStats,
  userId: string | null
): void {
  stats.total++;

  if (userId) {
    stats.assigned++;
    stats.byUser.set(userId, (stats.byUser.get(userId) || 0) + 1);
  } else {
    stats.unassigned++;
  }
}
