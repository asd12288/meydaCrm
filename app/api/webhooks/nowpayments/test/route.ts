/**
 * Test Webhook Endpoint for NOWPayments
 *
 * DEVELOPMENT ONLY - This endpoint allows simulating NOWPayments IPN callbacks
 * without needing to complete actual payments. Disabled in production.
 *
 * Usage:
 * POST /api/webhooks/nowpayments/test
 * Body: { orderId: "crm-pay-xxx", status: "finished" }
 *
 * Or with paymentId:
 * Body: { paymentId: "123456", status: "finished" }
 *
 * Possible statuses:
 * - waiting, confirming, confirmed, sending, partially_paid
 * - finished (activates subscription)
 * - failed, refunded, expired
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface TestWebhookRequest {
  orderId?: string;
  paymentId?: string;
  status?: string;
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

export async function POST(request: NextRequest) {
  // CRITICAL: Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint disabled in production' },
      { status: 403 }
    );
  }

  try {
    const body: TestWebhookRequest = await request.json();
    const { orderId, paymentId, status = 'finished' } = body;

    if (!orderId && !paymentId) {
      return NextResponse.json(
        {
          error: 'orderId or paymentId required',
          usage: {
            endpoint: 'POST /api/webhooks/nowpayments/test',
            body: '{ orderId: "crm-pay-xxx", status: "finished" }',
            possibleStatuses: [
              'waiting',
              'confirming',
              'confirmed',
              'sending',
              'partially_paid',
              'finished',
              'failed',
              'refunded',
              'expired',
            ],
          },
        },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = [
      'waiting',
      'confirming',
      'confirmed',
      'sending',
      'partially_paid',
      'finished',
      'failed',
      'refunded',
      'expired',
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status: ${status}`,
          validStatuses,
        },
        { status: 400 }
      );
    }

    // Find the payment to get real data for simulation
    const supabaseAdmin = createAdminClient();

    let payment;
    if (paymentId) {
      const { data } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('nowpayments_payment_id', paymentId)
        .single();
      payment = data;
    }

    if (!payment && orderId) {
      const { data } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('nowpayments_order_id', orderId)
        .single();
      payment = data;
    }

    if (!payment) {
      // List available payments for convenience
      const { data: recentPayments } = await supabaseAdmin
        .from('payments')
        .select('id, nowpayments_order_id, nowpayments_payment_id, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      return NextResponse.json(
        {
          error: 'Payment not found',
          providedOrderId: orderId,
          providedPaymentId: paymentId,
          recentPayments: recentPayments || [],
          hint: 'Use one of the order IDs from recentPayments',
        },
        { status: 404 }
      );
    }

    // Construct simulated IPN payload
    const simulatedPayload = {
      payment_id: payment.nowpayments_payment_id || `test-${Date.now()}`,
      payment_status: status,
      pay_address: 'TTestAddress123456789',
      price_amount: parseFloat(payment.amount_usd),
      price_currency: 'usd',
      pay_amount: parseFloat(payment.amount_usd),
      pay_currency: 'usdttrc20',
      order_id: payment.nowpayments_order_id,
      order_description: `CRM Subscription - ${payment.plan} (${payment.period})`,
      actually_paid: status === 'finished' ? parseFloat(payment.amount_usd) : 0,
    };

    // Get base URL
    const appUrl =
      process.env.APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000');

    // Call the actual webhook endpoint with test mode header
    const webhookResponse = await fetch(`${appUrl}/api/webhooks/nowpayments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-test-mode': 'true', // Skip signature verification
      },
      body: JSON.stringify(simulatedPayload),
    });

    const webhookResult = await webhookResponse.json();

    // Fetch updated payment and subscription for response
    const { data: updatedPayment } = await supabaseAdmin
      .from('payments')
      .select('*, subscriptions(*)')
      .eq('id', payment.id)
      .single();

    return NextResponse.json({
      success: true,
      message: `Simulated ${status} webhook for payment`,
      simulatedPayload,
      webhookResponse: {
        status: webhookResponse.status,
        result: webhookResult,
      },
      currentState: {
        payment: {
          id: updatedPayment?.id,
          status: updatedPayment?.status,
          paid_at: updatedPayment?.paid_at,
        },
        subscription: updatedPayment?.subscriptions
          ? {
              id: updatedPayment.subscriptions.id,
              status: updatedPayment.subscriptions.status,
              plan: updatedPayment.subscriptions.plan,
              period: updatedPayment.subscriptions.period,
              start_date: updatedPayment.subscriptions.start_date,
              end_date: updatedPayment.subscriptions.end_date,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Test failed',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.stack
          : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Returns usage instructions
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint disabled in production' },
      { status: 403 }
    );
  }

  // List recent payments for convenience
  try {
    const supabaseAdmin = createAdminClient();
    const { data: recentPayments } = await supabaseAdmin
      .from('payments')
      .select('id, nowpayments_order_id, nowpayments_payment_id, status, amount_usd, plan, period, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      endpoint: 'POST /api/webhooks/nowpayments/test',
      description: 'Simulate NOWPayments webhook callbacks for testing',
      usage: {
        method: 'POST',
        body: {
          orderId: 'crm-pay-xxx (use from recentPayments below)',
          status: 'finished (or any valid status)',
        },
      },
      validStatuses: [
        'waiting - Invoice created, waiting for payment',
        'confirming - Payment received, awaiting confirmations',
        'confirmed - Enough confirmations, processing',
        'sending - Sending to merchant',
        'partially_paid - Underpaid',
        'finished - Complete (activates subscription)',
        'failed - Payment failed',
        'refunded - Payment refunded',
        'expired - Invoice expired',
      ],
      recentPayments: recentPayments || [],
      example: {
        curl: 'curl -X POST http://localhost:3000/api/webhooks/nowpayments/test -H "Content-Type: application/json" -d \'{"orderId": "crm-pay-xxx", "status": "finished"}\'',
      },
    });
  } catch {
    return NextResponse.json({
      endpoint: 'POST /api/webhooks/nowpayments/test',
      description: 'Simulate NOWPayments webhook callbacks for testing',
      error: 'Could not fetch recent payments',
    });
  }
}
