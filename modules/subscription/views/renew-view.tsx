'use client';

import { useState } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import type { SubscriptionPlan, SubscriptionPeriod } from '@/db/types';
import { PlanSelector } from '../components/plan-selector';
import { PaymentButton } from '../components/payment-button';
import { calculatePrice } from '../config/constants';

export function RenewView() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('pro');
  const [selectedPeriod, setSelectedPeriod] = useState<SubscriptionPeriod>('1_month');

  const handlePlanSelect = (plan: SubscriptionPlan, period: SubscriptionPeriod) => {
    setSelectedPlan(plan);
    setSelectedPeriod(period);
  };

  const price = calculatePrice(selectedPlan, selectedPeriod);

  return (
    <div className="min-h-screen bg-lightgray dark:bg-darkgray flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 mb-4">
            <IconAlertTriangle size={32} className="text-error" />
          </div>
          <h1 className="text-2xl font-bold text-ld mb-2">Abonnement expire</h1>
          <p className="text-darklink">
            Votre abonnement a expire. Renouvelez-le pour continuer a utiliser le CRM.
          </p>
        </div>

        {/* Plan Selector */}
        <div className="bg-white dark:bg-dark rounded-xl shadow-lg p-6 border border-ld mb-6">
          <PlanSelector
            onSelect={handlePlanSelect}
            defaultPlan={selectedPlan}
            defaultPeriod={selectedPeriod}
          />
        </div>

        {/* Payment Summary & Button */}
        <div className="bg-white dark:bg-dark rounded-xl shadow-lg p-6 border border-ld">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-darklink">Total a payer</p>
              <p className="text-2xl font-bold text-ld">${price} USD</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-darklink">Forfait selectionne</p>
              <p className="font-medium text-ld capitalize">{selectedPlan}</p>
            </div>
          </div>
          <PaymentButton plan={selectedPlan} period={selectedPeriod} />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-darklink mt-6">
          Besoin d&apos;aide? Contactez le support.
        </p>
      </div>
    </div>
  );
}
