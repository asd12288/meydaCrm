/**
 * NOWPayments Webhook Handler
 *
 * This API route handles IPN (Instant Payment Notification) callbacks from NOWPayments.
 * It verifies the signature, updates payment status, and activates subscriptions.
 *
 * Process:
 * 1. Verify HMAC-SHA512 signature from NOWPayments
 * 2. Find payment by payment_id or order_id
 * 3. Update payment status
 * 4. Activate subscription if payment is finished
 *
 * Features:
 * - Signature verification (HMAC-SHA512)
 * - Idempotency (won't reprocess final states)
 * - Renewal support (extends from existing end date if active)
 * - Structured logging for debugging
 * - Test mode support for development
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createWebhookLogger, WEBHOOK_EVENTS } from '@/lib/webhook-logger';
import { calculateSubscriptionEndDate } from '@/lib/subscription-helpers';

// Vercel function configuration
export const maxDuration = 60; // 1 minute max
export const dynamic = 'force-dynamic';

type PeriodId = '6_months' | '12_months';

// NOWPayments IPN payload interface
interface IPNPayload {
  payment_id: number | string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id?: string;
  outcome_amount?: number;
  outcome_currency?: string;
  actually_paid?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Sort object keys alphabetically (required for signature verification)
 */
function sortObject(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(obj)
    .sort()
    .reduce((result: Record<string, unknown>, key: string) => {
      const value = obj[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = sortObject(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
      return result;
    }, {});
}

/**
 * Verify HMAC-SHA512 signature
 */
async function verifySignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );

    // Parse and sort the payload
    const parsedPayload = JSON.parse(payload);
    const sortedPayload = JSON.stringify(sortObject(parsedPayload));

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(sortedPayload)
    );

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const calculatedSignature = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return calculatedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
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
 * POST handler for NOWPayments webhook
 */
export async function POST(request: NextRequest) {
  const logger = createWebhookLogger('NOWPAYMENTS_IPN');

  try {
    // Get IPN secret for signature verification
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;

    // Get the raw body for signature verification
    const rawBody = await request.text();

    // Get signature from header
    const signature = request.headers.get('x-nowpayments-sig');

    // Check for test mode (development only)
    const isTestMode =
      request.headers.get('x-test-mode') === 'true' &&
      process.env.NODE_ENV !== 'production';

    logger.info('Webhook received', {
      hasSignature: !!signature,
      isTestMode,
      bodyLength: rawBody.length,
    });

    // Verify signature if IPN secret is configured (skip in test mode)
    if (!isTestMode) {
      if (ipnSecret && signature) {
        const isValid = await verifySignature(rawBody, signature, ipnSecret);
        if (!isValid) {
          logger.error('Invalid IPN signature', { event: WEBHOOK_EVENTS.SIGNATURE_FAILED });
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
        logger.info('Signature verified', { event: WEBHOOK_EVENTS.SIGNATURE_VERIFIED });
      } else if (ipnSecret && !signature) {
        logger.error('Missing IPN signature header', { event: WEBHOOK_EVENTS.SIGNATURE_FAILED });
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      } else {
        logger.warn('IPN secret not configured - skipping signature verification');
      }
    } else {
      logger.info('Test mode - skipping signature verification');
    }

    // Parse the payload
    const payload: IPNPayload = JSON.parse(rawBody);

    // Set payment identifiers for logging
    const paymentId = payload.payment_id?.toString();
    const orderId = payload.order_id;
    logger.setPaymentId(paymentId);
    logger.setOrderId(orderId);

    logger.info('Processing IPN', {
      paymentStatus: payload.payment_status,
      priceAmount: payload.price_amount,
      priceCurrency: payload.price_currency,
    });

    // Create admin client with service role
    const supabaseAdmin = createAdminClient();

    // Find payment by NOWPayments payment ID or order ID
    let payment;

    // First try to find by nowpayments_payment_id
    if (paymentId) {
      const { data } = await supabaseAdmin
        .from('payments')
        .select('*, subscriptions(*)')
        .eq('nowpayments_payment_id', paymentId)
        .single();
      payment = data;
    }

    // If not found, try by order_id
    if (!payment && orderId) {
      const { data } = await supabaseAdmin
        .from('payments')
        .select('*, subscriptions(*)')
        .eq('nowpayments_order_id', orderId)
        .single();
      payment = data;
    }

    if (!payment) {
      logger.warn('Payment not found', { event: WEBHOOK_EVENTS.PAYMENT_NOT_FOUND });
      // Return 200 to prevent NOWPayments from retrying
      return NextResponse.json({ status: 'payment_not_found' }, { status: 200 });
    }

    logger.info('Payment found', {
      event: WEBHOOK_EVENTS.PAYMENT_FOUND,
      internalPaymentId: payment.id,
      currentStatus: payment.status,
    });

    // Map NOWPayments status to our status
    const statusMap: Record<string, string> = {
      waiting: 'waiting',
      confirming: 'confirming',
      confirmed: 'confirmed',
      sending: 'sending',
      partially_paid: 'partially_paid',
      finished: 'finished',
      failed: 'failed',
      refunded: 'refunded',
      expired: 'expired',
    };

    const newStatus = statusMap[payload.payment_status] || payment.status;

    // Check for idempotency - don't process if already in final state
    const finalStatuses = ['finished', 'failed', 'refunded', 'expired'];
    if (finalStatuses.includes(payment.status)) {
      logger.info('Payment already in final state', {
        event: WEBHOOK_EVENTS.ALREADY_PROCESSED,
        existingStatus: payment.status,
      });
      return NextResponse.json({ status: 'already_processed' }, { status: 200 });
    }

    // Update payment status
    const paymentUpdate: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // Update nowpayments_payment_id if we found by order_id
    if (!payment.nowpayments_payment_id && paymentId) {
      paymentUpdate.nowpayments_payment_id = paymentId;
    }

    // If payment is finished, set paid_at
    if (newStatus === 'finished') {
      paymentUpdate.paid_at = new Date().toISOString();
    }

    const { error: updatePaymentError } = await supabaseAdmin
      .from('payments')
      .update(paymentUpdate)
      .eq('id', payment.id);

    if (updatePaymentError) {
      logger.error('Error updating payment', {
        error: updatePaymentError.message,
        code: updatePaymentError.code,
      });
      return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
    }

    logger.info('Payment status updated', {
      event: WEBHOOK_EVENTS.STATUS_UPDATED,
      oldStatus: payment.status,
      newStatus,
    });

    // If payment is finished, activate the subscription
    if (newStatus === 'finished' && payment.subscriptions) {
      const subscription = payment.subscriptions;

      // Check if this is a renewal (subscription is active with future end date)
      const isRenewal =
        subscription.status === 'active' &&
        subscription.end_date &&
        new Date(subscription.end_date) > new Date();

      // Calculate end date - extend from current end if renewing
      const endDate = calculateSubscriptionEndDate(
        payment.period as PeriodId,
        isRenewal ? subscription.end_date : null
      );

      // Build update object
      const subscriptionUpdate: Record<string, unknown> = {
        status: 'active',
        plan: payment.plan, // Update to the new plan if changed
        period: payment.period, // Update to the new period
        end_date: endDate.toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Only set start_date for new subscriptions, not renewals
      if (!isRenewal) {
        subscriptionUpdate.start_date = new Date().toISOString();
      }

      const { error: updateSubError } = await supabaseAdmin
        .from('subscriptions')
        .update(subscriptionUpdate)
        .eq('id', subscription.id);

      if (updateSubError) {
        logger.error('Error activating subscription', {
          error: updateSubError.message,
          code: updateSubError.code,
        });
        return NextResponse.json(
          { error: 'Failed to activate subscription' },
          { status: 500 }
        );
      }

      logger.info(isRenewal ? 'Subscription renewed' : 'Subscription activated', {
        event: isRenewal
          ? WEBHOOK_EVENTS.SUBSCRIPTION_RENEWED
          : WEBHOOK_EVENTS.SUBSCRIPTION_ACTIVATED,
        subscriptionId: subscription.id,
        plan: payment.plan,
        period: payment.period,
        isRenewal,
        previousEndDate: isRenewal ? subscription.end_date : null,
        newEndDate: endDate.toISOString(),
      });
    }

    logger.complete('Webhook processed successfully', newStatus);
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    logger.fail('Webhook processing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Return 200 to prevent excessive retries from NOWPayments
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 200 });
  }
}


