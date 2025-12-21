'use client';

import { IconCalendar, IconClock, IconAlertTriangle } from '@tabler/icons-react';
import { CardBox } from '@/modules/shared';
import type { Subscription, SubscriptionPlan, SubscriptionPeriod } from '@/db/types';
import { SubscriptionBadge } from '../ui/subscription-badge';
import { PaymentButton } from './payment-button';
import { PLANS, PERIODS } from '../config/constants';

interface SubscriptionSummaryCardProps {
  subscription: Subscription | null;
  daysRemaining: number | null;
  isGrace?: boolean;
  graceDaysRemaining?: number | null;
  selectedPlan: SubscriptionPlan;
  selectedPeriod: SubscriptionPeriod;
}

export function SubscriptionSummaryCard({
  subscription,
  daysRemaining,
  isGrace = false,
  graceDaysRemaining,
  selectedPlan,
  selectedPeriod,
}: SubscriptionSummaryCardProps) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Calculate progress percentage for days remaining
  const getProgressPercentage = () => {
    if (!subscription || !daysRemaining) return 0;
    // Handle legacy periods that may no longer exist in PERIODS config
    const periodConfig = PERIODS[subscription.period as keyof typeof PERIODS];
    const periodMonths = periodConfig?.months || 6; // Default to 6 months if period not found
    const totalDays = periodMonths * 30; // Approximate
    const percentage = (daysRemaining / totalDays) * 100;
    return Math.min(100, Math.max(0, percentage));
  };

  // No subscription state
  if (!subscription) {
    return (
      <CardBox className="h-full">
        <div className="flex flex-col h-full">
          <h4 className="card-title mb-4">Votre abonnement</h4>

          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-lightwarning flex items-center justify-center mb-3">
              <IconAlertTriangle size={24} className="text-warning" />
            </div>
            <p className="text-darklink mb-1">Aucun abonnement actif</p>
            <p className="text-sm text-darklink">
              Selectionnez un forfait pour commencer
            </p>
          </div>

          <div className="mt-auto pt-4 border-t border-border">
            <PaymentButton plan={selectedPlan} period={selectedPeriod} />
          </div>
        </div>
      </CardBox>
    );
  }

  const planConfig = PLANS[subscription.plan];
  const progressPercentage = getProgressPercentage();

  return (
    <CardBox className="h-full">
      <div className="flex flex-col h-full">
        {/* Header: Plan name + Status */}
        <div className="flex items-center justify-between mb-4">
          <h4 className="card-title">{planConfig.name}</h4>
          <SubscriptionBadge status={subscription.status} />
        </div>

        {/* Expiry date */}
        <div className="flex items-center gap-2 text-sm text-darklink mb-4">
          <IconCalendar size={16} />
          <span>Expire le {formatDate(subscription.endDate)}</span>
        </div>

        {/* Days remaining progress bar */}
        {subscription.status === 'active' && daysRemaining !== null && !isGrace && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-darklink">Temps restant</span>
              <span className={`font-medium ${daysRemaining <= 7 ? 'text-warning' : 'text-ld'}`}>
                {daysRemaining <= 0
                  ? "Expire aujourd'hui"
                  : daysRemaining === 1
                    ? '1 jour'
                    : `${daysRemaining} jours`}
              </span>
            </div>
            <div className="h-2 bg-lightprimary dark:bg-primary/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  daysRemaining <= 7 ? 'bg-warning' : 'bg-primary'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Grace period warning */}
        {isGrace && (
          <div className="p-3 rounded-lg bg-error/10 border border-error/20 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <IconClock size={16} className="text-error animate-pulse" />
              <span className="font-semibold text-error text-sm">Periode de grace</span>
            </div>
            <p className="text-xs text-error">
              {graceDaysRemaining === 1
                ? 'DERNIER JOUR! Renouvelez maintenant.'
                : graceDaysRemaining && graceDaysRemaining > 0
                  ? `${graceDaysRemaining} jours avant blocage.`
                  : 'Renouvelez immediatement.'}
            </p>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Payment button */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-darklink mb-3 text-center">
            {isGrace
              ? 'Renouveler immediatement'
              : subscription.status === 'active'
                ? 'Renouveler ou changer de forfait'
                : 'Souscrire maintenant'}
          </p>
          <PaymentButton plan={selectedPlan} period={selectedPeriod} />
        </div>
      </div>
    </CardBox>
  );
}
