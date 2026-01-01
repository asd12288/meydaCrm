'use client';

import { useState } from 'react';
import { IconCurrencyBitcoin, IconExternalLink } from '@tabler/icons-react';
import { Button, useFormState } from '@/modules/shared';
import { InlineSpinner, FormErrorAlert } from '@/modules/shared';
import type { SubscriptionPlan, SubscriptionPeriod } from '@/db/types';
import { createPayment } from '../lib/actions';
import { calculatePrice } from '../config/constants';

interface PaymentButtonProps {
  plan: SubscriptionPlan;
  period: SubscriptionPeriod;
  disabled?: boolean;
}

export function PaymentButton({ plan, period, disabled = false }: PaymentButtonProps) {
  const { error, setError, resetError } = useFormState();
  const [isLoading, setIsLoading] = useState(false);

  const price = calculatePrice(plan, period);

  const handlePayment = async () => {
    setIsLoading(true);
    resetError();

    try {
      const result = await createPayment(plan, period);

      if (!result.success || !result.paymentUrl) {
        setError(result.error || 'Erreur lors de la creation du paiement');
        return;
      }

      // Redirect to payment page (no toast - user leaves page)
      window.location.href = result.paymentUrl;
    } catch (err) {
      console.error('Payment error:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <FormErrorAlert error={error} />

      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={handlePayment}
        disabled={disabled || isLoading}
        className="w-full py-3"
      >
        {isLoading ? (
          <InlineSpinner>Creation du paiement...</InlineSpinner>
        ) : (
          <>
            <IconCurrencyBitcoin size={20} />
            <span>Payer ${price} avec USDT</span>
            <IconExternalLink size={16} className="ml-1" />
          </>
        )}
      </Button>

      <p className="text-xs text-center text-darklink">
        Vous serez redirige vers NOWPayments pour effectuer le paiement en USDT (TRC20)
      </p>
    </div>
  );
}


