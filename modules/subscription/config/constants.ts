import type { SubscriptionPlan, SubscriptionPeriod } from '@/db/types';

// Plan configuration
export interface PlanConfig {
  id: SubscriptionPlan;
  name: string;
  basePrice: number;
  leads: number;
  features: string[];
}

export const PLANS: Record<SubscriptionPlan, PlanConfig> = {
  standard: {
    id: 'standard',
    name: 'Basic',
    basePrice: 180,
    leads: 10000,
    features: [
      '10 utilisateurs maximum',
      '10 000 leads maximum',
      'Support par email (48h)',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    basePrice: 220,
    leads: Infinity,
    features: [
      'Utilisateurs illimites',
      'Leads illimites',
      'Support prioritaire (24h)',
      'Sauvegardes automatiques',
      'Export des donnees',
      'Modifications sur demande',
      'Confidentialite et chiffrement des donnees',
    ],
  },
};

// Period configuration
export interface PeriodConfig {
  id: SubscriptionPeriod;
  months: number;
  discount: number;
  label: string;
  shortLabel: string;
}

export const PERIODS: Record<SubscriptionPeriod, PeriodConfig> = {
  '6_months': {
    id: '6_months',
    months: 6,
    discount: 0,
    label: '6 Mois',
    shortLabel: '6 mois',
  },
  '12_months': {
    id: '12_months',
    months: 12,
    discount: 0.08,
    label: '12 Mois (-8%)',
    shortLabel: '12 mois',
  },
};

// Calculate price for a plan and period
export function calculatePrice(plan: SubscriptionPlan, period: SubscriptionPeriod): number {
  const planConfig = PLANS[plan];
  // Handle legacy periods - default to 6_months if period not found
  const periodConfig = PERIODS[period as keyof typeof PERIODS] || PERIODS['6_months'];

  const totalBeforeDiscount = planConfig.basePrice * periodConfig.months;
  const discountAmount = totalBeforeDiscount * periodConfig.discount;

  return Math.round(totalBeforeDiscount - discountAmount);
}

// Get monthly price for display
export function getMonthlyPrice(plan: SubscriptionPlan, period: SubscriptionPeriod): number {
  const total = calculatePrice(plan, period);
  // Handle legacy periods - default to 6_months if period not found
  const periodConfig = PERIODS[period as keyof typeof PERIODS] || PERIODS['6_months'];
  return Math.round(total / periodConfig.months);
}

// Pre-calculated prices for reference
// Basic: $1,080 (6mo, $180/mo), $1,987 (12mo, ~$166/mo with 8% off)
// Pro: $1,320 (6mo, $220/mo), $2,429 (12mo, ~$202/mo with 8% off)

// Grace period in days after subscription expires before full block
export const GRACE_PERIOD_DAYS = 7;

// Subscription status labels in French
export const SUBSCRIPTION_STATUS_LABELS = {
  pending: 'En attente',
  active: 'Actif',
  grace: 'Periode de grace',
  expired: 'Expire',
  cancelled: 'Annule',
} as const;

// Subscription status colors for badges
export const SUBSCRIPTION_STATUS_COLORS = {
  pending: 'warning',
  active: 'success',
  grace: 'warning',
  expired: 'error',
  cancelled: 'secondary',
} as const;

// Payment status labels in French
export const PAYMENT_STATUS_LABELS = {
  waiting: 'En attente',
  confirming: 'Confirmation en cours',
  confirmed: 'Confirme',
  sending: 'Envoi en cours',
  partially_paid: 'Partiellement paye',
  finished: 'Termine',
  failed: 'Echoue',
  refunded: 'Rembourse',
  expired: 'Expire',
} as const;

// Payment status colors for badges
export const PAYMENT_STATUS_COLORS = {
  waiting: 'warning',
  confirming: 'info',
  confirmed: 'info',
  sending: 'info',
  partially_paid: 'warning',
  finished: 'success',
  failed: 'error',
  refunded: 'secondary',
  expired: 'error',
} as const;

// Grace period in days before expiry warning
export const EXPIRY_WARNING_DAYS = 7;

// Plan options for select dropdown
export const PLAN_OPTIONS = Object.values(PLANS).map((plan) => ({
  value: plan.id,
  label: plan.name,
}));

// Period options for select dropdown
export const PERIOD_OPTIONS = Object.values(PERIODS).map((period) => ({
  value: period.id,
  label: period.label,
}));
