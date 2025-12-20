/**
 * Create Payment API Route
 *
 * This API route handles payment creation for subscriptions.
 * It creates a subscription, payment record, and NOWPayments invoice.
 *
 * Process:
 * 1. Verify user is authenticated and is admin
 * 2. Validate plan and period
 * 3. Create or update subscription
 * 4. Create payment record
 * 5. Create NOWPayments invoice
 * 6. Return payment URL for redirect
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Vercel function configuration
export const maxDuration = 60; // 1 minute max
export const dynamic = 'force-dynamic';

// Plan pricing configuration
const PLANS = {
  standard: { basePrice: 99 },
  pro: { basePrice: 199 },
} as const;

const PERIODS = {
  '1_month': { months: 1, discount: 0 },
  '3_months': { months: 3, discount: 0.1 },
  '12_months': { months: 12, discount: 0.15 },
} as const;

type PlanId = keyof typeof PLANS;
type PeriodId = keyof typeof PERIODS;

interface CreatePaymentRequest {
  plan: PlanId;
  period: PeriodId;
}

function calculatePrice(plan: PlanId, period: PeriodId): number {
  const basePrice = PLANS[plan].basePrice;
  const { months, discount } = PERIODS[period];
  const totalBeforeDiscount = basePrice * months;
  const discountAmount = totalBeforeDiscount * discount;
  return Math.round(totalBeforeDiscount - discountAmount);
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

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * POST handler for payment creation
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated and is admin
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acces non autorise' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: CreatePaymentRequest = await request.json();
    const { plan, period } = body;

    if (!plan || !period) {
      return NextResponse.json(
        { error: 'Plan et periode requis' },
        { status: 400 }
      );
    }

    if (!PLANS[plan] || !PERIODS[period]) {
      return NextResponse.json(
        { error: 'Plan ou periode invalide' },
        { status: 400 }
      );
    }

    // Calculate price
    const amountUsd = calculatePrice(plan, period);

    // Create admin client for database operations
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
        return NextResponse.json(
          { error: 'Erreur lors de la mise a jour de l\'abonnement' },
          { status: 500 }
        );
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
        return NextResponse.json(
          { error: 'Erreur lors de la creation de l\'abonnement' },
          { status: 500 }
        );
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
      return NextResponse.json(
        { error: 'Erreur lors de la creation du paiement' },
        { status: 500 }
      );
    }

    // Get environment variables for NOWPayments
    const nowpaymentsApiKey = process.env.NOWPAYMENTS_API_KEY;
    const appUrl =
      process.env.APP_URL ||
      (process.env.NODE_ENV === 'development'
        ? 'https://sheep-wanted-squirrel.ngrok-free.app'
        : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000');

    if (!nowpaymentsApiKey) {
      console.error('NOWPAYMENTS_API_KEY not configured');
      return NextResponse.json(
        { error: 'Configuration de paiement manquante' },
        { status: 500 }
      );
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
      success_url: `${appUrl}/support?payment=success`,
      cancel_url: `${appUrl}/support?payment=cancelled`,
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
      return NextResponse.json(
        { error: 'Erreur lors de la creation de la facture' },
        { status: 500 }
      );
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

    return NextResponse.json({
      success: true,
      paymentUrl: invoiceData.invoice_url,
      paymentId: payment.id,
      orderId,
      amountUsd,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Erreur inattendue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
