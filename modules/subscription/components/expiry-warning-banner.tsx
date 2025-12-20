'use client';

import { IconAlertTriangle, IconX, IconClock } from '@tabler/icons-react';
import { useState } from 'react';
import Link from 'next/link';

interface ExpiryWarningBannerProps {
  daysRemaining: number;
  isGrace?: boolean;
  graceDaysRemaining?: number | null;
}

export function ExpiryWarningBanner({
  daysRemaining,
  isGrace = false,
  graceDaysRemaining,
}: ExpiryWarningBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't allow dismissal during grace period - it's too important
  if (isDismissed && !isGrace) {
    return null;
  }

  // Determine message based on state
  let message: string;

  if (isGrace) {
    // In grace period - more urgent messaging
    if (graceDaysRemaining === 1) {
      message = "DERNIER JOUR! Votre abonnement a expire. Votre acces sera bloque demain.";
    } else if (graceDaysRemaining && graceDaysRemaining > 0) {
      message = `Votre abonnement a expire! Il vous reste ${graceDaysRemaining} jours pour renouveler avant blocage.`;
    } else {
      message = "Votre abonnement a expire! Renouvelez immediatement pour eviter le blocage.";
    }
  } else {
    // Active subscription approaching expiry
    if (daysRemaining <= 0) {
      message = "Votre abonnement expire aujourd'hui.";
    } else if (daysRemaining === 1) {
      message = 'Votre abonnement expire demain.';
    } else {
      message = `Votre abonnement expire dans ${daysRemaining} jours.`;
    }
  }

  // Use red/error for grace period, warning/orange for approaching expiry
  const bgClass = isGrace ? 'bg-error/10 border-error/20' : 'bg-warning/10 border-warning/20';
  const textClass = isGrace ? 'text-error' : 'text-warning';
  const hoverClass = isGrace ? 'hover:bg-error/20' : 'hover:bg-warning/20';

  return (
    <div className={`${bgClass} border-b px-4 py-3`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {isGrace ? (
            <IconClock size={20} className={`${textClass} flex-shrink-0 animate-pulse`} />
          ) : (
            <IconAlertTriangle size={20} className={`${textClass} flex-shrink-0`} />
          )}
          <p className={`text-sm ${textClass} font-medium`}>
            {message}{' '}
            <Link href="/subscription" className="underline hover:no-underline font-bold">
              Renouvelez maintenant
            </Link>
            {!isGrace && " pour eviter l'interruption de service."}
          </p>
        </div>
        {!isGrace && (
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className={`p-1 ${hoverClass} rounded transition-colors`}
            aria-label="Fermer"
          >
            <IconX size={18} className={textClass} />
          </button>
        )}
      </div>
    </div>
  );
}
