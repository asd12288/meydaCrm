import { createClient } from '@/lib/supabase/server';
import type { Subscription, SubscriptionStatus } from '@/db/types';
import { createNotificationForUsers } from '@/modules/notifications';
import { shouldNotifyAdmins } from '@/lib/subscription-helpers';
import { ROLES } from '@/lib/constants';

const EXPIRY_WARNING_DAYS = 7;
const GRACE_PERIOD_DAYS = 7;
// Notification deduplication window in hours
const NOTIFICATION_WINDOW_HOURS = 12;

export interface SubscriptionCheckResult {
  isActive: boolean;
  daysRemaining: number | null;
  showWarning: boolean;
  subscription: Subscription | null;
  status: SubscriptionStatus | null;
  isInGrace: boolean;
  graceDaysRemaining: number | null;
}

/**
 * Check subscription status for layout enforcement
 * This function is designed to be called from the protected layout
 * It checks if there's an active subscription and calculates days remaining
 *
 * IMPORTANT: This function includes notification deduplication and idempotency guards
 * to prevent duplicate notifications and status updates on every page navigation.
 */
export async function checkSubscriptionStatus(): Promise<SubscriptionCheckResult> {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isActive: false,
      daysRemaining: null,
      showWarning: false,
      subscription: null,
      status: null,
      isInGrace: false,
      graceDaysRemaining: null,
    };
  }

  // Check user role - only apply subscription enforcement to admins
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Sales users always have access (subscription is an admin concern)
  if (profile?.role !== ROLES.ADMIN) {
    return {
      isActive: true,
      daysRemaining: null,
      showWarning: false,
      subscription: null,
      status: null,
      isInGrace: false,
      graceDaysRemaining: null,
    };
  }

  // Fetch subscription - admins can see subscription due to RLS policy
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) {
    // No subscription means not active (for admin)
    return {
      isActive: false,
      daysRemaining: null,
      showWarning: false,
      subscription: null,
      status: null,
      isInGrace: false,
      graceDaysRemaining: null,
    };
  }

  // Supabase returns snake_case, but our types use camelCase
  // We need to handle both for safety
  const subscription = data as Subscription;
  const subscriptionEndDate = (data as { end_date?: string }).end_date || subscription.endDate;

  // If already in grace period, calculate remaining grace days
  if (subscription.status === 'grace') {
    const endDate = subscriptionEndDate ? new Date(subscriptionEndDate) : null;
    let graceDaysRemaining = null;

    if (endDate) {
      const now = new Date();
      const daysSinceExpiry = Math.floor(
        (now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      graceDaysRemaining = Math.max(0, GRACE_PERIOD_DAYS - daysSinceExpiry);

      // If grace period has ended, update to expired
      if (graceDaysRemaining <= 0) {
        await supabase
          .from('subscriptions')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', subscription.id);

        return {
          isActive: false,
          daysRemaining: null,
          showWarning: false,
          subscription: { ...subscription, status: 'expired' },
          status: 'expired',
          isInGrace: false,
          graceDaysRemaining: null,
        };
      }
    }

    // In grace period - still active but show warning
    // Send notification to all admin users (with deduplication)
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', ROLES.ADMIN);

    if (admins && admins.length > 0) {
      const adminIds = admins.map((a) => a.id);

      // Check if notification was sent recently to prevent duplicates
      const shouldNotify = await shouldNotifyAdmins(
        supabase,
        adminIds,
        'subscription_warning',
        NOTIFICATION_WINDOW_HOURS
      );

      if (shouldNotify) {
        await createNotificationForUsers(
          adminIds,
          'subscription_warning',
          'Alerte abonnement',
          graceDaysRemaining === 1
            ? 'DERNIER JOUR! Votre abonnement a expire. Votre acces sera bloque demain.'
            : `Votre abonnement a expire! Il vous reste ${graceDaysRemaining} jours pour renouveler.`,
          { daysRemaining: 0, isGrace: true },
          '/subscription'
        );
      }
    }

    return {
      isActive: true,
      daysRemaining: 0,
      showWarning: true,
      subscription,
      status: 'grace',
      isInGrace: true,
      graceDaysRemaining,
    };
  }

  // Check if subscription status is active
  if (subscription.status !== 'active') {
    return {
      isActive: false,
      daysRemaining: null,
      showWarning: false,
      subscription,
      status: subscription.status,
      isInGrace: false,
      graceDaysRemaining: null,
    };
  }

  // Calculate days remaining
  if (!subscriptionEndDate) {
    return {
      isActive: true,
      daysRemaining: null,
      showWarning: false,
      subscription,
      status: 'active',
      isInGrace: false,
      graceDaysRemaining: null,
    };
  }

  const endDate = new Date(subscriptionEndDate);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Check if subscription period has ended - enter grace period
  if (daysRemaining <= 0) {
    // IDEMPOTENCY: Only update if status is currently 'active'
    // This prevents updating on every page navigation
    if (subscription.status === 'active') {
      await supabase
        .from('subscriptions')
        .update({ status: 'grace', updated_at: new Date().toISOString() })
        .eq('id', subscription.id)
        .eq('status', 'active'); // Double-check to prevent race conditions
    }

    // Calculate grace days remaining
    const daysSinceExpiry = Math.abs(daysRemaining);
    const graceDaysRemaining = Math.max(0, GRACE_PERIOD_DAYS - daysSinceExpiry);

    // If already past grace period, set to expired
    if (graceDaysRemaining <= 0) {
      await supabase
        .from('subscriptions')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', subscription.id);

      return {
        isActive: false,
        daysRemaining: 0,
        showWarning: false,
        subscription: { ...subscription, status: 'expired' },
        status: 'expired',
        isInGrace: false,
        graceDaysRemaining: null,
      };
    }

    // In grace period - still active but show warning
    // Send notification to all admin users (with deduplication)
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', ROLES.ADMIN);

    if (admins && admins.length > 0) {
      const adminIds = admins.map((a) => a.id);

      // Check if notification was sent recently to prevent duplicates
      const shouldNotify = await shouldNotifyAdmins(
        supabase,
        adminIds,
        'subscription_warning',
        NOTIFICATION_WINDOW_HOURS
      );

      if (shouldNotify) {
        await createNotificationForUsers(
          adminIds,
          'subscription_warning',
          'Alerte abonnement',
          graceDaysRemaining === 1
            ? 'DERNIER JOUR! Votre abonnement a expire. Votre acces sera bloque demain.'
            : `Votre abonnement a expire! Il vous reste ${graceDaysRemaining} jours pour renouveler.`,
          { daysRemaining: 0, isGrace: true },
          '/subscription'
        );
      }
    }

    return {
      isActive: true,
      daysRemaining: 0,
      showWarning: true,
      subscription: { ...subscription, status: 'grace' },
      status: 'grace',
      isInGrace: true,
      graceDaysRemaining,
    };
  }

  // Check if should show warning (7 days before expiry)
  const showWarning = daysRemaining <= EXPIRY_WARNING_DAYS;

  // Send notification when warning threshold is reached (with deduplication)
  if (showWarning) {
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', ROLES.ADMIN);

    if (admins && admins.length > 0) {
      const adminIds = admins.map((a) => a.id);

      // Check if notification was sent recently to prevent duplicates
      const shouldNotify = await shouldNotifyAdmins(
        supabase,
        adminIds,
        'subscription_warning',
        NOTIFICATION_WINDOW_HOURS
      );

      if (shouldNotify) {
        await createNotificationForUsers(
          adminIds,
          'subscription_warning',
          'Alerte abonnement',
          daysRemaining === 0
            ? "Votre abonnement expire aujourd'hui."
            : daysRemaining === 1
              ? 'Votre abonnement expire demain.'
              : `Votre abonnement expire dans ${daysRemaining} jours.`,
          { daysRemaining, isGrace: false },
          '/subscription'
        );
      }
    }
  }

  return {
    isActive: true,
    daysRemaining,
    showWarning,
    subscription,
    status: 'active',
    isInGrace: false,
    graceDaysRemaining: null,
  };
}


