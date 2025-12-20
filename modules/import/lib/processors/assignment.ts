/**
 * Lead Assignment Logic
 *
 * Handles different assignment modes for imported leads:
 * - none: No assignment
 * - single: All leads to one user
 * - round_robin: Distribute across multiple users
 * - by_column: Read assignee from file column
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export type AssignmentMode = 'none' | 'single' | 'round_robin' | 'by_column';

export interface AssignmentConfig {
  mode: AssignmentMode;
  singleUserId?: string;
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
// CONTEXT BUILDER
// ============================================================================

/**
 * Build assignment context with pre-loaded data
 *
 * For by_column mode, pre-loads all users for fast lookup.
 */
export async function buildAssignmentContext(
  supabase: SupabaseClient,
  config: AssignmentConfig
): Promise<AssignmentContext> {
  const userMap = new Map<string, string>();

  // Pre-load users for by_column mode
  if (config.mode === 'by_column') {
    console.log('[Assignment] Pre-loading users for by_column mode');

    const { data: users } = await supabase
      .from('profiles')
      .select('id, display_name, role');

    if (users) {
      for (const user of users) {
        // Map by lowercase display name
        if (user.display_name) {
          userMap.set(user.display_name.toLowerCase().trim(), user.id);
        }
        // Also map by ID for direct ID references
        userMap.set(user.id.toLowerCase(), user.id);
      }
    }

    console.log(`[Assignment] Loaded ${userMap.size} user mappings`);
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

    case 'single':
      return config.singleUserId || null;

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
      const columnValue = rawData[config.assignmentColumn]?.toLowerCase?.().trim();
      if (!columnValue) {
        return null;
      }
      return userMap.get(columnValue) || null;
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

    case 'single':
      if (!config.singleUserId) {
        return { isValid: false, error: 'User ID required for single assignment' };
      }
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
