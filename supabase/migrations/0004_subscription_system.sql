-- Subscription System Migration
-- Adds subscriptions and payments tables for crypto payment support

-- Create subscription plan enum
CREATE TYPE "public"."subscription_plan" AS ENUM('standard', 'pro');

-- Create subscription period enum
CREATE TYPE "public"."subscription_period" AS ENUM('1_month', '3_months', '12_months');

-- Create subscription status enum
CREATE TYPE "public"."subscription_status" AS ENUM('pending', 'active', 'expired', 'cancelled');

-- Create payment status enum (from NOWPayments)
CREATE TYPE "public"."payment_status" AS ENUM('waiting', 'confirming', 'confirmed', 'sending', 'partially_paid', 'finished', 'failed', 'refunded', 'expired');

-- Create subscriptions table
CREATE TABLE "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "plan" "subscription_plan" NOT NULL,
  "period" "subscription_period" NOT NULL,
  "status" "subscription_status" DEFAULT 'pending' NOT NULL,
  "start_date" timestamp with time zone,
  "end_date" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on subscriptions
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;

-- Create payments table
CREATE TABLE "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "subscription_id" uuid NOT NULL REFERENCES "subscriptions"("id") ON DELETE CASCADE,
  "plan" "subscription_plan" NOT NULL,
  "period" "subscription_period" NOT NULL,
  "amount_usd" numeric(10,2) NOT NULL,
  "nowpayments_payment_id" text UNIQUE,
  "nowpayments_order_id" text,
  "payment_url" text,
  "status" "payment_status" DEFAULT 'waiting' NOT NULL,
  "paid_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on payments
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;

-- Create indexes for payments
CREATE INDEX "payments_subscription_id_idx" ON "payments" USING btree ("subscription_id");
CREATE INDEX "payments_nowpayments_payment_id_idx" ON "payments" USING btree ("nowpayments_payment_id");
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");

-- RLS Policies for subscriptions (admin-only)
CREATE POLICY "admin_read_subscriptions" ON "subscriptions"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (public.get_user_role() = 'admin');

CREATE POLICY "admin_insert_subscriptions" ON "subscriptions"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "admin_update_subscriptions" ON "subscriptions"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "admin_delete_subscriptions" ON "subscriptions"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING (public.get_user_role() = 'admin');

-- RLS Policies for payments (admin-only)
CREATE POLICY "admin_read_payments" ON "payments"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (public.get_user_role() = 'admin');

CREATE POLICY "admin_insert_payments" ON "payments"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "admin_update_payments" ON "payments"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "admin_delete_payments" ON "payments"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING (public.get_user_role() = 'admin');

-- Also add a policy to allow service role full access (for webhook updates)
-- Service role bypasses RLS by default, but we document this for clarity
COMMENT ON TABLE "subscriptions" IS 'Global CRM subscription - single row expected. Admin-only access, service role for webhooks.';
COMMENT ON TABLE "payments" IS 'Payment history for subscriptions. Admin-only access, service role for webhook updates.';
