'use client';

import { useState } from 'react';
import type { SubscriptionPlan, SubscriptionPeriod } from '@/db/types';
import { CardBox } from '@/modules/shared';
import { PlanCard } from '../ui/plan-card';
import { PeriodSelector } from '../ui/period-selector';
import { PLANS } from '../config/constants';

interface PlanSelectorProps {
  onSelect: (plan: SubscriptionPlan, period: SubscriptionPeriod) => void;
  defaultPlan?: SubscriptionPlan;
  defaultPeriod?: SubscriptionPeriod;
  disabled?: boolean;
}

export function PlanSelector({
  onSelect,
  defaultPlan = 'standard',
  defaultPeriod = '6_months',
  disabled = false,
}: PlanSelectorProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(defaultPlan);
  const [selectedPeriod, setSelectedPeriod] = useState<SubscriptionPeriod>(defaultPeriod);

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    if (disabled) return;
    setSelectedPlan(plan);
    onSelect(plan, selectedPeriod);
  };

  const handlePeriodChange = (period: SubscriptionPeriod) => {
    if (disabled) return;
    setSelectedPeriod(period);
    onSelect(selectedPlan, period);
  };

  const plans = Object.keys(PLANS) as SubscriptionPlan[];

  return (
    <CardBox className="h-full">
      {/* Header with period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h4 className="card-title">Choisir un forfait</h4>
        <PeriodSelector value={selectedPeriod} onChange={handlePeriodChange} />
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <PlanCard
            key={plan}
            plan={plan}
            period={selectedPeriod}
            isSelected={selectedPlan === plan}
            onSelect={() => handlePlanSelect(plan)}
          />
        ))}
      </div>
    </CardBox>
  );
}
