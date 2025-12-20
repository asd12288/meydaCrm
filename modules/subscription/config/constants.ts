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
    name: 'Standard',
    basePrice: 99,
    leads: 10000,
    features: [
      '10 000 leads maximum',
      'Support par email (48h)',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    basePrice: 199,
    leads: Infinity,
    features: [
      'Leads illimites',
      'Support prioritaire (24h)',
      'Sauvegardes automatiques',
      'Modifications sur demande',
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
  '1_month': {
    id: '1_month',
    months: 1,
    discount: 0,
    label: '1 Mois',
    shortLabel: '1 mois',
  },
  '3_months': {
    id: '3_months',
    months: 3,
    discount: 0.10,
    label: '3 Mois (-10%)',
    shortLabel: '3 mois',
  },
  '12_months': {
    id: '12_months',
    months: 12,
    discount: 0.15,
    label: '12 Mois (-15%)',
    shortLabel: '12 mois',
  },
};

// Calculate price for a plan and period
export function calculatePrice(plan: SubscriptionPlan, period: SubscriptionPeriod): number {
  const planConfig = PLANS[plan];
  const periodConfig = PERIODS[period];
  
  const totalBeforeDiscount = planConfig.basePrice * periodConfig.months;
  const discountAmount = totalBeforeDiscount * periodConfig.discount;
  
  return Math.round(totalBeforeDiscount - discountAmount);
}

// Get monthly price for display
export function getMonthlyPrice(plan: SubscriptionPlan, period: SubscriptionPeriod): number {
  const total = calculatePrice(plan, period);
  const months = PERIODS[period].months;
  return Math.round(total / months);
}

// Pre-calculated prices for reference
// Standard: $99 (1mo), $267 (3mo, ~$89/mo), $1,010 (12mo, ~$84/mo)
// Pro: $199 (1mo), $537 (3mo, ~$179/mo), $2,030 (12mo, ~$169/mo)

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
