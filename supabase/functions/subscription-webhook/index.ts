import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Period configuration for calculating end date
const PERIODS = {
  "1_month": { months: 1 },
  "3_months": { months: 3 },
  "12_months": { months: 12 },
} as const;

type PeriodId = keyof typeof PERIODS;

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

// Sort object keys alphabetically (required for signature verification)
function sortObject(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(obj)
    .sort()
    .reduce((result: Record<string, unknown>, key: string) => {
      const value = obj[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        result[key] = sortObject(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
      return result;
    }, {});
}

// Verify HMAC-SHA512 signature
async function verifySignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );

    // Parse and sort the payload
    const parsedPayload = JSON.parse(payload);
    const sortedPayload = JSON.stringify(sortObject(parsedPayload));

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(sortedPayload)
    );

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const calculatedSignature = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return calculatedSignature === signature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

// Calculate end date based on period
function calculateEndDate(period: PeriodId): Date {
  const now = new Date();
  const months = PERIODS[period]?.months || 1;
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + months);
  return endDate;
}

Deno.serve(async (req: Request) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Get IPN secret for signature verification
    const ipnSecret = Deno.env.get("NOWPAYMENTS_IPN_SECRET");
    
    // Get the raw body for signature verification
    const rawBody = await req.text();
    
    // Get signature from header
    const signature = req.headers.get("x-nowpayments-sig");
    
    // Verify signature if IPN secret is configured
    if (ipnSecret && signature) {
      const isValid = await verifySignature(rawBody, signature, ipnSecret);
      if (!isValid) {
        console.error("Invalid IPN signature");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      console.log("IPN signature verified successfully");
    } else if (ipnSecret && !signature) {
      console.error("Missing IPN signature header");
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    } else {
      console.warn("IPN secret not configured - skipping signature verification");
    }

    // Parse the payload
    const payload: IPNPayload = JSON.parse(rawBody);
    console.log("Received IPN payload:", JSON.stringify(payload));

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Find payment by NOWPayments payment ID or order ID
    const paymentId = payload.payment_id?.toString();
    const orderId = payload.order_id;

    let payment;

    // First try to find by nowpayments_payment_id
    if (paymentId) {
      const { data } = await supabaseAdmin
        .from("payments")
        .select("*, subscriptions(*)")
        .eq("nowpayments_payment_id", paymentId)
        .single();
      payment = data;
    }

    // If not found, try by order_id
    if (!payment && orderId) {
      const { data } = await supabaseAdmin
        .from("payments")
        .select("*, subscriptions(*)")
        .eq("nowpayments_order_id", orderId)
        .single();
      payment = data;
    }

    if (!payment) {
      console.error("Payment not found for ID:", paymentId, "Order:", orderId);
      // Return 200 to prevent NOWPayments from retrying
      return new Response(
        JSON.stringify({ status: "payment_not_found" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Found payment:", payment.id, "Current status:", payment.status);

    // Map NOWPayments status to our status
    const statusMap: Record<string, string> = {
      waiting: "waiting",
      confirming: "confirming",
      confirmed: "confirmed",
      sending: "sending",
      partially_paid: "partially_paid",
      finished: "finished",
      failed: "failed",
      refunded: "refunded",
      expired: "expired",
    };

    const newStatus = statusMap[payload.payment_status] || payment.status;

    // Check for idempotency - don't process if already in final state
    const finalStatuses = ["finished", "failed", "refunded", "expired"];
    if (finalStatuses.includes(payment.status)) {
      console.log("Payment already in final state:", payment.status);
      return new Response(
        JSON.stringify({ status: "already_processed" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
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
    if (newStatus === "finished") {
      paymentUpdate.paid_at = new Date().toISOString();
    }

    const { error: updatePaymentError } = await supabaseAdmin
      .from("payments")
      .update(paymentUpdate)
      .eq("id", payment.id);

    if (updatePaymentError) {
      console.error("Error updating payment:", updatePaymentError);
      return new Response(
        JSON.stringify({ error: "Failed to update payment" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Payment status updated to:", newStatus);

    // If payment is finished, activate the subscription
    if (newStatus === "finished" && payment.subscriptions) {
      const subscription = payment.subscriptions;
      const endDate = calculateEndDate(payment.period as PeriodId);

      const { error: updateSubError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "active",
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id);

      if (updateSubError) {
        console.error("Error activating subscription:", updateSubError);
        return new Response(
          JSON.stringify({ error: "Failed to activate subscription" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      console.log("Subscription activated:", subscription.id, "End date:", endDate.toISOString());
    }

    return new Response(
      JSON.stringify({ status: "ok" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    // Return 200 to prevent excessive retries from NOWPayments
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
});
