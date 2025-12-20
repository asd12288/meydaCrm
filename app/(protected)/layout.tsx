import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardLayout } from '@/modules/layout';
import { getProfile, createDefaultProfile } from '@/lib/auth';
import { checkSubscriptionStatus } from '@/lib/subscription';
import { SubscriptionBlockedModal } from '@/modules/subscription/components/subscription-blocked-modal';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Get session - middleware already validated auth
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session, middleware should have redirected - but handle edge case
  if (!session?.user) {
    redirect('/login');
  }

  // Fetch user profile with role (properly normalized from snake_case)
  const profile = await getProfile(supabase, session.user.id);

  // Check subscription status (only applies to admins)
  const subscriptionStatus = await checkSubscriptionStatus();

  // For admins, only block if subscription is EXPIRED (not grace)
  // Allow: no subscription (new user), pending, active, grace (with warning)
  // Block: expired only
  const isAdmin = profile?.role === 'admin';
  const subscriptionExpired = subscriptionStatus.status === 'expired';
  const showBlockedModal = isAdmin && subscriptionExpired;

  // Subscription info for dashboard layout (warning banner)
  const subscriptionInfo = {
    showWarning: subscriptionStatus.showWarning,
    daysRemaining: subscriptionStatus.daysRemaining,
    isGrace: subscriptionStatus.isInGrace,
    graceDaysRemaining: subscriptionStatus.graceDaysRemaining,
  };

  if (!profile) {
    // Create a default profile object if not found (shouldn't happen with trigger)
    const defaultProfile = createDefaultProfile(
      session.user.id,
      session.user.user_metadata?.display_name ||
        session.user.email?.split('@')[0] ||
        'User'
    );
    return (
      <DashboardLayout profile={defaultProfile} subscription={subscriptionInfo}>
        {showBlockedModal && <SubscriptionBlockedModal isOpen={true} />}
        {children}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout profile={profile} subscription={subscriptionInfo}>
      {showBlockedModal && <SubscriptionBlockedModal isOpen={true} />}
      {children}
    </DashboardLayout>
  );
}
