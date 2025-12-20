'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/modules/auth';
import type {
  Subscription,
  Payment,
  SubscriptionPlan,
  SubscriptionPeriod,
  CreatePaymentResponse,
} from '../types';
import { EXPIRY_WARNING_DAYS, calculatePrice } from '../config/constants';

/**
 * Get the base URL for webhooks and redirects
 */
function getAppUrl(): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  if (process.env.NODE_ENV === 'development') {
    return 'https://sheep-wanted-squirrel.ngrok-free.app';
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

/**
 * Create admin Supabase client (bypasses RLS)
 */
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Normalize subscription data from snake_case to camelCase
 */
function normalizeSubscription(data: Record<string, unknown>): Subscription {
  return {
    id: data.id as string,
    plan: data.plan as Subscription['plan'],
    period: data.period as Subscription['period'],
    status: data.status as Subscription['status'],
    startDate: data.start_date ? new Date(data.start_date as string) : null,
    endDate: data.end_date ? new Date(data.end_date as string) : null,
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
  };
}

/**
 * Normalize payment data from snake_case to camelCase
 */
function normalizePayment(data: Record<string, unknown>): Payment {
  return {
    id: data.id as string,
    subscriptionId: data.subscription_id as string,
    plan: data.plan as Payment['plan'],
    period: data.period as Payment['period'],
    amountUsd: data.amount_usd as string,
    nowpaymentsPaymentId: data.nowpayments_payment_id as string | null,
    nowpaymentsOrderId: data.nowpayments_order_id as string | null,
    paymentUrl: data.payment_url as string | null,
    status: data.status as Payment['status'],
    paidAt: data.paid_at ? new Date(data.paid_at as string) : null,
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
  };
}

/**
 * Get the current subscription status
 * Admin only
 */
export async function getSubscription(): Promise<Subscription | null> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    // No subscription found is not an error
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching subscription:', error);
    return null;
  }

  return normalizeSubscription(data as Record<string, unknown>);
}

/**
 * Get payment history
 * Admin only
 */
export async function getPaymentHistory(): Promise<Payment[]> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching payments:', error);
    return [];
  }

  return (data || []).map((p) => normalizePayment(p as Record<string, unknown>));
}

/**
 * Create a new payment and NOWPayments invoice
 * Admin only - directly handles payment creation without API route
 */
export async function createPayment(
  plan: SubscriptionPlan,
  period: SubscriptionPeriod
): Promise<CreatePaymentResponse> {
  // Verify user is admin
  await requireAdmin();

  try {
    // Calculate price
    const amountUsd = calculatePrice(plan, period);

    // Create admin client for database operations (bypasses RLS)
    const supabaseAdmin = createAdminClient();

    // Upsert subscription (create if not exists, or update if pending)
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .limit(1)
      .single();

    let subscriptionId: string;

    if (existingSubscription) {
      // Update existing subscription with new plan/period (keeping status)
      const { data: updatedSub, error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          plan,
          period,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return {
          success: false,
          error: "Erreur lors de la mise a jour de l'abonnement",
        };
      }
      subscriptionId = updatedSub.id;
    } else {
      // Create new subscription
      const { data: newSub, error: createError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          plan,
          period,
          status: 'pending',
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating subscription:', createError);
        return {
          success: false,
          error: "Erreur lors de la creation de l'abonnement",
        };
      }
      subscriptionId = newSub.id;
    }

    // Generate unique order ID
    const orderId = `crm-pay-${crypto.randomUUID()}`;

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        subscription_id: subscriptionId,
        plan,
        period,
        amount_usd: amountUsd,
        nowpayments_order_id: orderId,
        status: 'waiting',
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      return {
        success: false,
        error: 'Erreur lors de la creation du paiement',
      };
    }

    // Get environment variables for NOWPayments
    const nowpaymentsApiKey = process.env.NOWPAYMENTS_API_KEY;
    const appUrl = getAppUrl();

    if (!nowpaymentsApiKey) {
      console.error('NOWPAYMENTS_API_KEY not configured');
      return {
        success: false,
        error: 'Configuration de paiement manquante',
      };
    }

    // Determine API URL (sandbox or production)
    const nowpaymentsApiUrl =
      process.env.NOWPAYMENTS_SANDBOX === 'true'
        ? 'https://api-sandbox.nowpayments.io'
        : 'https://api.nowpayments.io';

    // Create NOWPayments invoice
    const invoicePayload = {
      price_amount: amountUsd,
      price_currency: 'usd',
      pay_currency: 'usdttrc20',
      order_id: orderId,
      order_description: `CRM Subscription - ${plan} (${period.replace('_', ' ')})`,
      ipn_callback_url: `${appUrl}/api/webhooks/nowpayments`,
      success_url: `${appUrl}/subscription?payment=success`,
      cancel_url: `${appUrl}/subscription?payment=cancelled`,
    };

    console.log('Creating NOWPayments invoice:', JSON.stringify(invoicePayload));

    const invoiceResponse = await fetch(`${nowpaymentsApiUrl}/v1/invoice`, {
      method: 'POST',
      headers: {
        'x-api-key': nowpaymentsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoicePayload),
    });

    if (!invoiceResponse.ok) {
      const errorText = await invoiceResponse.text();
      console.error('NOWPayments error:', errorText);
      return {
        success: false,
        error: 'Erreur lors de la creation de la facture',
      };
    }

    const invoiceData = await invoiceResponse.json();
    console.log('NOWPayments invoice created:', JSON.stringify(invoiceData));

    // Update payment with NOWPayments data
    const { error: updatePaymentError } = await supabaseAdmin
      .from('payments')
      .update({
        nowpayments_payment_id: invoiceData.id?.toString(),
        payment_url: invoiceData.invoice_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    if (updatePaymentError) {
      console.error('Error updating payment:', updatePaymentError);
      // Don't fail - payment can still proceed
    }

    return {
      success: true,
      paymentUrl: invoiceData.invoice_url,
      paymentId: payment.id,
      orderId,
      amountUsd,
    };
  } catch (error) {
    console.error('Error creating payment:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      success: false,
      error: `Erreur lors de la creation du paiement: ${message}`,
    };
  }
}

/**
 * Check subscription status for enforcement
 * Returns whether subscription is active and days remaining
 */
export async function getSubscriptionStatus(): Promise<{
  isActive: boolean;
  daysRemaining: number | null;
  showWarning: boolean;
  subscription: Subscription | null;
}> {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isActive: false,
      daysRemaining: null,
      showWarning: false,
      subscription: null,
    };
  }

  // Fetch subscription using service role to bypass RLS
  // (subscription check happens for all users in layout)
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) {
    // No subscription means not active
    return {
      isActive: false,
      daysRemaining: null,
      showWarning: false,
      subscription: null,
    };
  }

  const subscription = data as Subscription;

  // Check if subscription is active
  if (subscription.status !== 'active') {
    return {
      isActive: false,
      daysRemaining: null,
      showWarning: false,
      subscription,
    };
  }

  // Calculate days remaining
  if (!subscription.endDate) {
    return {
      isActive: true,
      daysRemaining: null,
      showWarning: false,
      subscription,
    };
  }

  const endDate = new Date(subscription.endDate);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Check if expired
  if (daysRemaining <= 0) {
    // Update subscription status to expired
    await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('id', subscription.id);

    return {
      isActive: false,
      daysRemaining: 0,
      showWarning: false,
      subscription: { ...subscription, status: 'expired' },
    };
  }

  // Check if should show warning
  const showWarning = daysRemaining <= EXPIRY_WARNING_DAYS;

  return {
    isActive: true,
    daysRemaining,
    showWarning,
    subscription,
  };
}
