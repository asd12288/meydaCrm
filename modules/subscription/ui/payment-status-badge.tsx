'use client';

import type { PaymentStatus } from '@/db/types';
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
} from '../config/constants';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function PaymentStatusBadge({ status, size = 'md', className = '' }: PaymentStatusBadgeProps) {
  const label = PAYMENT_STATUS_LABELS[status];
  const color = PAYMENT_STATUS_COLORS[status];

  const colorClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    secondary: 'badge-secondary',
    info: 'badge-info',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: '',
  };

  return (
    <span className={`${colorClasses[color]} ${sizeClasses[size]} ${className}`}>
      {label}
    </span>
  );
}


