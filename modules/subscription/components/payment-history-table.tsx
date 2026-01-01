'use client';

import { CardBox, TableEmptyState } from '@/modules/shared';
import type { Payment } from '@/db/types';
import { PaymentStatusBadge } from '../ui/payment-status-badge';
import { PLANS, PERIODS } from '../config/constants';

interface PaymentHistoryTableProps {
  payments: Payment[];
}

export function PaymentHistoryTable({ payments }: PaymentHistoryTableProps) {
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '-';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '-';
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: string | number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '-';
    return `$${numAmount.toFixed(2)}`;
  };

  return (
    <CardBox>
      <h4 className="card-title mb-4">Historique des paiements</h4>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-medium text-darklink">
                Date
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-darklink">
                Forfait
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-darklink">
                Periode
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-darklink">
                Montant
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-darklink">
                Statut
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <TableEmptyState colSpan={5} message="Aucun paiement" />
            ) : (
              payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-border last:border-0 hover:bg-hover"
                >
                  <td className="py-3 px-4 text-sm text-ld">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="py-3 px-4 text-sm text-ld">
                    {PLANS[payment.plan]?.name || payment.plan}
                  </td>
                  <td className="py-3 px-4 text-sm text-ld">
                    {PERIODS[payment.period]?.label || payment.period}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-ld">
                    {formatAmount(payment.amountUsd)}
                  </td>
                  <td className="py-3 px-4">
                    <PaymentStatusBadge status={payment.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </CardBox>
  );
}


