'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { IconCheck, IconX } from '@tabler/icons-react';
import { PageHeader } from '@/modules/shared';
import type { Subscription, Payment, SubscriptionPlan, SubscriptionPeriod } from '@/db/types';
import { SubscriptionSummaryCard } from '../components/subscription-summary-card';
import { PlanSelector } from '../components/plan-selector';
import { PaymentHistoryPreview } from '../components/payment-history-preview';

interface SubscriptionViewProps {
  subscription: Subscription | null;
  payments: Payment[];
  daysRemaining: number | null;
  isGrace?: boolean;
  graceDaysRemaining?: number | null;
}

export function SubscriptionView({
  subscription,
  payments,
  daysRemaining,
  isGrace = false,
  graceDaysRemaining,
}: SubscriptionViewProps) {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    subscription?.plan || 'pro'
  );
  const [selectedPeriod, setSelectedPeriod] = useState<SubscriptionPeriod>(
    subscription?.period || '1_month'
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  // Handle payment callback - setState legitimately depends on URL param
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (paymentStatus === 'success') {
      setShowSuccess(true);
      window.history.replaceState({}, '', '/subscription');
    } else if (paymentStatus === 'cancelled') {
      setShowCancelled(true);
      window.history.replaceState({}, '', '/subscription');
    }
  }, [paymentStatus]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handlePlanSelect = (plan: SubscriptionPlan, period: SubscriptionPeriod) => {
    setSelectedPlan(plan);
    setSelectedPeriod(period);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Abonnement"
        description="Gerez votre abonnement et vos paiements"
      />

      {/* Payment success/cancelled alerts */}
      {showSuccess && (
        <div className="bg-lightsuccess dark:bg-success/10 border border-success/20 rounded-lg p-4 flex items-start gap-3">
          <IconCheck size={20} className="text-success shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-success">Paiement en cours de traitement</p>
            <p className="text-sm text-success/80 mt-1">
              Votre paiement est en cours de verification. L&apos;abonnement sera active automatiquement une fois le paiement confirme.
            </p>
          </div>
        </div>
      )}

      {showCancelled && (
        <div className="bg-lightwarning dark:bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-start gap-3">
          <IconX size={20} className="text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-warning">Paiement annule</p>
            <p className="text-sm text-warning/80 mt-1">
              Le paiement a ete annule. Vous pouvez reessayer a tout moment.
            </p>
          </div>
        </div>
      )}

      {/* Two-column layout: Summary on left, Plan selection on right */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Subscription summary with payment button */}
        <div className="lg:col-span-1">
          <SubscriptionSummaryCard
            subscription={subscription}
            daysRemaining={daysRemaining}
            isGrace={isGrace}
            graceDaysRemaining={graceDaysRemaining}
            selectedPlan={selectedPlan}
            selectedPeriod={selectedPeriod}
          />
        </div>

        {/* Right column: Plan selector */}
        <div className="lg:col-span-2">
          <PlanSelector
            onSelect={handlePlanSelect}
            defaultPlan={selectedPlan}
            defaultPeriod={selectedPeriod}
          />
        </div>
      </div>

      {/* Payment history (compact) */}
      <PaymentHistoryPr