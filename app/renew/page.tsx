import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/auth';
import { checkSubscriptionStatus } from '@/lib/subscription';
import { RenewView } from '@/modules/subscription/views/renew-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Renouveler votre abonnement',
  description: 'Renouvelez votre abonnement pour continuer a utiliser le CRM',
};

export default async function RenewPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const profile = await getProfile(supabase, user.id);
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Check subscription status
  const subscriptionStatus = await checkSubscriptionStatus();

  // If subscription is active, redirect to dashboard
  if (subscriptionStatus.status === 'active' || subscriptionStatus.status === 'grace') {
    redirect('/dashboard');
  }

  // If no subscription or pending, redirect to subscription page
  if (!subscriptionStatus.subscription || subscriptionStatus.status === 'pending') {
    redirect('/subscription');
  }

  return <RenewView />;
}
