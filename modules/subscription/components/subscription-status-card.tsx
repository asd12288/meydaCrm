'use client';

import { IconCalendar, IconClock } from '@tabler/icons-react';
import { CardBox } from '@/modules/shared';
import type { Subscription } from '@/db/types';
import { SubscriptionBadge } from '../ui/subscription-badge';
import { PLANS, PERIODS } from '../config/constants';

interface SubscriptionStatusCardProps {
  subscription: Subscription | null;
  daysRemaining: number | null;
  isGrace?: boolean;
  graceDaysRemaining?: number | null;
}

export function SubscriptionStatusCard({
  subscription,
  daysRemaining,
  isGrace = false,
  graceDaysRemaining,
}: SubscriptionStatusCardProps) {
  if (!subscription) {
    return (
      <CardBox>
        <h4 className="card-title mb-4">Statut de l&apos;abonnement</h4>
        <div className="text-center py-8">
          <p className="text-darklink mb-2">Aucun abonnement actif</p>
          <p className="text-sm text-darklink">
            Selectionnez un forfait ci-dessous pour commencer
          </p>
        </div>
      </CardBox>
    );
  }

  const planConfig = PLANS[subscription.plan];
  const periodConfig = PERIODS[subscription.period];

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <CardBox>
      <div className="flex items-center justify-between mb-4">
        <h4 className="card-title">Statut de l&apos;abonnement</h4>
        <SubscriptionBadge status={subscription.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Plan info */}
        <div className="space-y-3">
          <div>
            <p className="text-sm text-darklink">Forfait</p>
            <p className="font-medium text-ld">{planConfig.name}</p>
          </div>
          <div>
            <p className="text-sm text-darklink">Periode</p>
            <p className="font-medium text-ld">{periodConfig.label}</p>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <IconCalendar size={16} className="text-darklink" />
            <div>
              <p className="text-sm text-darklink">Date de debut</p>
              <p className="font-medium text-ld">{formatDate(subscription.startDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IconClock size={16} className="text-darklink" />
            <div>
              <p className="text-sm text-darklink">Date d&apos;expiration</p>
              <p className="font-medium text-ld">{formatDate(subscription.endDate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grace period warning - urgent */}
      {isGrace && (
        <div className="mt-4 p-4 rounded-lg bg-error/10 border border-error/20">
          <div className="flex items-center gap-2 mb-2">
            <IconClock size={18} className="text-error animate-pulse" />
            <p className="font-bold text-error">Periode de grace</p>
          </div>
          <p className="text-sm text-error">
            {graceDaysRemaining === 1
              ? 'DERNIER JOUR! Votre acces sera bloque demain si vous ne renouvelez pas.'
              : graceDaysRemaining && graceDaysRemaining > 0
                ? `Il vous reste ${graceDaysRemaining} jours pour renouveler avant blocage complet.`
                : 'Renouvelez immediatement pour eviter le blocage.'}
          </p>
        </div>
      )}

      {/* Days remaining warning - for active subscriptions */}
      {subscription.status === 'active' && !isGrace && daysRemaining !== null && (
        <div
          className={`mt-4 p-3 rounded-lg ${
            daysRemaining <= 7
              ? 'bg-lightwarning dark:bg-warning/10 text-warning'
              : 'bg-lightsuccess dark:bg-success/10 text-success'
          }`}
        >
          <p className="text-sm font-medium">
            {daysRemaining <= 0
              ? 'Votre abonnement expire aujourd\'hui'
              : daysRemaining === 1
                ? '1 jour restant'
                : `${daysRemaining} jours restants`}
          </p>
        </div>
      )}
    </CardBox>
  );
}
