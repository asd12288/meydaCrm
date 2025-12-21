'use client';

import { IconAlertTriangle, IconX, IconClock } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ExpiryWarningBannerProps {
  daysRemaining: number;
  isGrace?: boolean;
  graceDaysRemaining?: number | null;
}

/**
 * Get storage key for banner dismissal
 * Uses daily key so banner reappears each day
 */
function getDismissalStorageKey(): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `subscription-banner-dismissed-${today}`;
}

/**
 * Check if banner was dismissed today
 */
function wasDismissedToday(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(getDismissalStorageKey()) === 'true';
  } catch {
    return false;
  }
}

/**
 * Save dismissal to localStorage
 */
function saveDismissal(): void {
  if (typeof window === 'undefined') return;
  try {
    // Clean up old dismissal keys (from previous days)
    const currentKey = getDismissalStorageKey();
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('subscription-banner-dismissed-') && key !== currentKey) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Save current dismissal
    localStorage.setItem(currentKey, 'true');
  } catch {
    // Ignore localStorage errors (e.g., in private browsing)
  }
}

export function ExpiryWarningBanner({
  daysRemaining,
  isGrace = false,
  graceDaysRemaining,
}: ExpiryWarningBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Check localStorage on mount (client-side only)
  useEffect(() => {
    // Use requestAnimationFrame to avoid synchronous setState in effect
    requestAnimationFrame(() => {
      setIsHydrated(true);
      if (!isGrace) {
        // Only check dismissal for non-grace period (grace is too important to dismiss)
        setIsDismissed(wasDismissedToday());
      }
    });
  }, [isGrace]);

  // Handle dismissal
  const handleDismiss = () => {
    saveDismissal();
    setIsDismissed(true);
  };

  // Don't render during SSR to avoid hydration mismatch
  if (!isHydrated) {
    return null;
  }

  // Don't allow dismissal during grace period - it's too important
  if (isDismissed && !isGrace) {
    return null;
  }

  // Determine message based on state
  let message: string;

  if (isGrace) {
    // In grace period - more urgent messaging
    if (graceDaysRemaining === 1) {
      message = 'DERNIER JOUR! Votre abonnement a expire. Votre acces sera bloque demain.';
    } else if (graceDaysRemaining && graceDaysRemaining > 0) {
      message = `Votre abonnement a expire! Il vous reste ${graceDaysRemaining} jours pour renouveler avant blocage.`;
    } else {
      message = 'Votre abonnement a expire! Renouvelez immediatement pour eviter le blocage.';
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
  // Solid backgrounds (not transparent)
  const bgClass = isGrace ? 'bg-error border-error' : 'bg-warning border-warning';
  const textClass = 'text-white';
  const hoverClass = isGrace ? 'hover:bg-error/80' : 'hover:bg-warning/80';

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
            onClick={handleDismiss}
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
