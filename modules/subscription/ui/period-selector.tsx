'use client';

import type { SubscriptionPeriod } from '@/db/types';
import { PERIODS } from '../config/constants';

interface PeriodSelectorProps {
  value: SubscriptionPeriod;
  onChange: (period: SubscriptionPeriod) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const periods = Object.values(PERIODS);

  return (
    <div className="inline-flex p-1 bg-lightgray dark:bg-dark rounded-lg border border-border">
      {periods.map((period) => (
        <button
          key={period.id}
          type="button"
          onClick={() => onChange(period.id)}
          className={`
            px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
            ${value === period.id
              ? 'bg-primary text-white shadow-sm'
              : 'text-darklink hover:text-ld'
            }
          `}
        >
          {period.shortLabel}
          {period.discount > 0 && (
            <span className={`ml-1 text-xs ${value === period.id ? 'text-white/80' : 'text-success'}`}>
              -{period.discount * 100}%
            </span>
          )}
        </button>
      ))}
    </div>
  );
}


