/**
 * Subscription Helper Utilities
 *
 * Shared utilities for subscription management including:
 * - Notification deduplication
 * - Subscription date calculations
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Check if any admin user should receive a subscription notification
 * Used for batch notification checks before sending to all admins
 *
 * @param supabase - Supabase client
 * @param adminIds - Array of admin user IDs
 * @param type - Notification type
 * @param windowHours - Time window in hours
 * @returns true if at least one admin should receive notification
 */
export async function shouldNotifyAdmins(
  supabase: SupabaseClient,
  adminIds: string[],
  type: string,
  windowHours: number = 24
): Promise<boolean> {
  if (adminIds.length === 0) return false;

  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - windowHours);

  // Check if ANY admin received this notification type recently
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .in('user_id', adminIds)
    .eq('type', type)
    .gte('created_at', windowStart.toISOString());

  if (error) {
    console.error('[Subscription] Error checking admin notification deduplication:', error);
    return true; // Fail open
  }

  // Only notify if no admin received this notification recently
  return (count || 0) === 0;
}

/**
 * Calculate subscription end date, optionally extending from existing end date
 *
 * @param period - Subscription period ('6_months', '12_months')
 * @param fromDate - Optional existing end date to extend from
 * @returns Calculated end date
 */
export function calculateSubscriptionEndDate(
  period: '6_months' | '12_months',
  fromDate?: Date | string | null
): Date {
  const periodMonths: Record<string, number> = {
    '6_months': 6,
    '12_months': 12,
  };

  const months = periodMonths[period] || 1;

  // Determine start date
  const now = new Date();
  let baseDate: Date;

  if (fromDate) {
    baseDate = new Date(fromDate);
    // If the existing end date is in the future, extend from it
    // If it's in the past, start from now
    if (baseDate < now) {
      baseDate = now;
    }
  } else {
    baseDate = now;
  }

  // Calculate new end date by adding months
  const endDate = new Date(baseDate);
  endDate.setMonth(endDate.getMonth() + months);

  return endDate;
}
