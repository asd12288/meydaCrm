import type {
  Subscription,
  Payment,
  SubscriptionPlan,
  SubscriptionPeriod,
  SubscriptionStatus,
  PaymentStatus,
} from '@/db/types';

// Re-export database types
export type {
  Subscription,
  Payment,
  SubscriptionPlan,
  SubscriptionPeriod,
  SubscriptionStatus,
  PaymentStatus,
};

// Subscription with additional computed fields
export interface SubscriptionWithDetails extends Subscription {
  daysRemaining: number | null;
  isExpired: boolean;
  showWarning: boolean;
}

// Payment with formatted data for display
export interface PaymentForDisplay extends Payment {
  formattedDate: string;
  formattedAmount: string;
  statusLabel: string;
  statusColor: string;
}

// Subscription status check result
export interface SubscriptionStatusResult {
  isActive: boolean;
  daysRemaining: number | null;
  showWarning: boolean;
  subscription: Subscription | null;
}

// Create payment request
export interface CreatePaymentRequest {
  plan: SubscriptionPlan;
  period: SubscriptionPeriod;
}

// Create payment response
export interface CreatePaymentResponse {
  success: boolean;
  paymentUrl?: string;
  paymentId?: string;
  orderId?: string;
  amountUsd?: number;
  error?: string;
}


