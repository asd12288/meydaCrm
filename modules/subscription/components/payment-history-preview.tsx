'use client';

import { useState } from 'react';
import { IconChevronDown, IconChevronUp, IconReceipt } from '@tabler/icons-react';
import { CardBox } from '@/modules/shared';
import type { Payment } from '@/db/types';
import { PaymentStatusBadge } from '../ui/payment-status-badge';
import { PLANS, PERIODS } from '../config/constants';

interface PaymentHistoryPreviewProps {
  payments: Payment[];
  maxItems?: number;
}

export function PaymentHistoryPreview({
  payments,
  maxItems = 3
}: PaymentHistoryPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '-';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '-';
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: string | number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '-';
    return `$${numAmount.toFixed(2)}`;
  };

  const displayedPayments = isExpanded ? payments : payments.slice(0, maxItems);
  const hasMore = payments.length > maxItems;

  if (payments.length === 0) {
    return (
      <CardBox>
        <div className="flex items-center gap-2 text-darklink">
          <IconReceipt size={18} />
          <span className="text-sm">Aucun paiement</span>
        </div>
      </CardBox>
    );
  }

  return (
    <CardBox>
      <div className="flex items-center justify-between mb-4">
        <h4 className="card-title">Historique des paiements</h4>
        <span className="text-xs text-darklink">{payments.length} paiement(s)</span>
      </div>

      <div className="space-y-2">
        {displayedPayments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-lightgray dark:bg-dark/50 border border-border"
          >
            {/* Left: Date and Plan */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-darklink w-24">
                {formatDate(payment.createdAt)}
              </span>
              <span className="text-sm text-ld">
                {PLANS[payment.plan]?.name || payment.plan}
                <span className="text-darklink ml-1">
                  ({PERIODS[payment.period]?.shortLabel || payment.period})
                </span>
              </span>
            </div>

            {/* Right: Amount and Status */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-ld">
                {formatAmount(payment.amountUsd)}
              </span>
              <PaymentStatusBadge status={payment.status} size="sm" />
            </div>
          </div>
        ))}
      </div>

      {/* Expand/Collapse button */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 py-2 text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-1 transition-colors"
        >
          {isExpanded ? (
            <>
              <IconChevronUp size={16} />
              Voir moins
            </>
          ) : (
            <>
              <IconChevronDown size={16} />
              Voir les {payments.length - maxItems} autres
            </>
          )}
        </button>
      )}
    </CardBox>
  );
}
