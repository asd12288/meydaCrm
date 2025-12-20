import { Suspense } from 'react';
import { requireAdmin } from '@/modules/auth';
import { SubscriptionView } from '@/modules/subscription/views/subscription-view';
import { getSubscription, getPaymentHistory } from '@/modules/subscription/lib/actions';
import { checkSubscriptionStatus } from '@/lib/subscription';
import { Spinner } from '@/modules/shared';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Abonnement',
  description: 'Gerez votre abonnement et vos paiements',
};

export default async function SubscriptionPage() {
  await requireAdmin();

  // Fetch data in parallel
  const [subscription, payments, subscriptionStatus] = await Promise.all([
    getSubscription(),
    getPaymentHistory(),
    checkSubscriptionStatus(),
  ]);

  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Spinner size="lg" /></div>}>
      <SubscriptionView
        subscription={subscription}
        payments={payments}
        daysRemaining={subscriptionStatus.daysRemaining}
        isGrace={subscriptionStatus.isInGrace}
        graceDaysRemaining={subscriptionStatus.graceDaysRemaining}
      />
    </Suspense>
  );
}
