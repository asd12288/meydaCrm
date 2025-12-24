'use client';

import { IconLock, IconCreditCard } from '@tabler/icons-react';
import Link from 'next/link';
import { Button } from '@/modules/shared';

interface SubscriptionBlockedModalProps {
  isOpen: boolean;
}

export function SubscriptionBlockedModal({ isOpen }: SubscriptionBlockedModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white dark:bg-dark rounded-xl shadow-xl max-w-md w-full mx-4 p-8 text-center max-h-[90vh] overflow-y-auto">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-error/10 flex items-center justify-center">
          <IconLock size={32} className="text-error" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-ld mb-3">
          Abonnement expire
        </h2>

        {/* Message */}
        <p className="text-darklink mb-6">
          Votre abonnement a expire. Veuillez renouveler pour continuer a utiliser le CRM.
        </p>

        {/* Action button */}
        <Button variant="primary" size="lg" className="w-full py-3" asChild>
          <Link href="/subscription">
            <IconCreditCard size={20} />
            <span>Renouveler maintenant</span>
          </Link>
        </Button>

        {/* Help text */}
        <p className="text-xs text-darklink mt-4">
          Besoin d&apos;aide ? Contactez le support.
        </p>
      </div>
    </div>
  );
}
