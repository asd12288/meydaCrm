/**
 * Subscription Helper Utilities
 *
 * Shared utilities for subscription management including:
 * - Notification deduplication
 * - Payment cleanup
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Check if we should create a subscription notification
 * Prevents duplicate notifications by checking for recent ones
 *
 * @param supabase - Supabase client (can be admin or regular)
 * @param userId - User ID to check notifications for
 * @param type - Notification type (e.g., 'subscription_warning')
 * @param windowHours - Time window in hours (default 24)
 * @returns true if notification should be created, false if recent one exists
 */
export async function shouldCreateSubscriptionNotification(
  supabase: SupabaseClient,
  userId: string,
  type: string,
  windowHours: number = 24
): Promise<boolean> {
  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - windowHours);

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', type)
    .gte('created_at', windowStart.toISOString());

  if (error) {
    // On error, allow notification to be created (fail open)
    console.error('[Subscription] Error checking notification deduplication:', error);
    return true;
  }

  return (count || 0) === 0;
}

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
 * Mark stale payments as expired
 * Payments older than specified hours in 'waiting' status are considered expired
 *
 * @param supabase - Supabase admin client (needs service role for RLS bypass)
 * @param hoursOld - Hours after which waiting payments are expired (default 24)
 * @returns Number of payments marked as expired
 */
export async function cleanupExpiredPayments(
  supabase: SupabaseClient,
  hoursOld: number = 24
): Promise<number> {
  const expiryCutoff = new Date();
  expiryCutoff.setHours(expiryCutoff.getHours() - hoursOld);

  const { data, error } = await supabase
    .from('payments')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'waiting')
    .lt('created_at', expiryCutoff.toISOString())
    .select('id');

  if (error) {
    console.error('[Payment Cleanup] Error marking payments as expired:', error);
    return 0;
  }

  const count = data?.length || 0;
  if (count > 0) {
    console.log(`[Payment Cleanup] Marked ${count} stale payments as expired`);
  }

  return count;
}

/**
 * Calculate subscription end date, optionally extending from existing end date
 *
 * @param period - Subscription period ('1_month', '3_months', '12_months')
 * @param fromDate - Optional existing end date to extend from
 * @returns Calculated end date
 */
export function calculateSubscriptionEndDate(
  period: '1_month' | '3_months' | '12_months',
  fromDate?: Date | string | null
): Date {
  const periodMonths: Record<string, number> = {
    '1_month': 1,
    '3_months': 3,
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

/**
 * Check if subscription should transition to grace period
 * Returns the number of grace days remaining, or null if not applicable
 *
 * @param endDate - Subscription end date
 * @param gracePeriodDays - Number of grace period days (default 7)
 * @returns Object with isInGrace flag and daysRemaining
 */
export function checkGracePeriod(
  endDate: Date | string,
  gracePeriodDays: number = 7
): { isInGrace: boolean; daysRemaining: number | null } {
  const end = new Date(endDate);
  const now = new Date();

  if (now < end) {
    // Subscription still active
    return { isInGrace: false, daysRemaining: null };
  }

  const daysSinceExpiry = Math.floor(
    (now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceExpiry >= gracePeriodDays) {
    // Grace period has ended
    return { isInGrace: false, daysRemaining: 0 };
  }

  // In grace period
  const daysRemaining = gracePeriodDays - daysSinceExpiry;
  return { isInGrace: true, daysRemaining };
}
