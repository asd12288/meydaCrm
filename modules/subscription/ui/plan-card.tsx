'use client';

import { IconCheck, IconStar } from '@tabler/icons-react';
import type { SubscriptionPlan, SubscriptionPeriod } from '@/db/types';
import { PLANS, calculatePrice, getMonthlyPrice, PERIODS } from '../config/constants';

interface PlanCardProps {
  plan: SubscriptionPlan;
  period: SubscriptionPeriod;
  isSelected: boolean;
  onSelect: () => void;
}

export function PlanCard({ plan, period, isSelected, onSelect }: PlanCardProps) {
  const planConfig = PLANS[plan];
  const totalPrice = calculatePrice(plan, period);
  const monthlyPrice = getMonthlyPrice(plan, period);
  const periodConfig = PERIODS[period];
  const isPopular = plan === 'pro';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        relative p-5 rounded-xl border-2 transition-all text-left w-full
        ${isSelected
          ? 'border-primary bg-lightprimary dark:bg-primary/10'
          : 'border-border hover:border-primary/50 bg-white dark:bg-dark'
        }
      `}
    >
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-warning text-white text-xs font-semibold flex items-center gap-1">
          <IconStar size={12} />
          Populaire
        </div>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <IconCheck size={14} className="text-white" />
        </div>
      )}

      {/* Plan name */}
      <h3 className="text-lg font-semibold text-ld mb-2">{planConfig.name}</h3>

      {/* Price */}
      <div className="mb-3">
        <span className="text-2xl font-bold text-primary">${totalPrice}</span>
        <span className="text-darklink text-sm ml-1">/ {periodConfig.shortLabel}</span>
        {periodConfig.months > 1 && (
          <div className="text-xs text-darklink mt-0.5">
            ~${monthlyPrice}/mois
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-1.5">
        {planConfig.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-ld">
            <IconCheck size={14} className="text-success mt-0.5 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}
