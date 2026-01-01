'use client';

import type { SubscriptionStatus } from '@/db/types';
import {
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_COLORS,
} from '../config/constants';

interface SubscriptionBadgeProps {
  status: SubscriptionStatus;
  className?: string;
}

export function SubscriptionBadge({ status, className = '' }: SubscriptionBadgeProps) {
  const label = SUBSCRIPTION_STATUS_LABELS[status];
  const color = SUBSCRIPTION_STATUS_COLORS[status];

  const colorClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    secondary: 'badge-secondary',
    info: 'badge-info',
  };

  return (
    <span className={`${colorClasses[color]} ${className}`}>
      {label}
    </span>
  );
}


