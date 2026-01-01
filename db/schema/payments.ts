import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgPolicy,
  uuid,
  text,
  timestamp,
  numeric,
  index,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';
import {
  subscriptionPlanEnum,
  subscriptionPeriodEnum,
  paymentStatusEnum,
} from './enums';
import { subscriptions } from './subscriptions';

/**
 * Payments table - Track all subscription payments
 * Links to subscriptions and stores NOWPayments references
 */
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Link to subscription
    subscriptionId: uuid('subscription_id')
      .references(() => subscriptions.id, { onDelete: 'cascade' })
      .notNull(),

    // Snapshot of what was purchased (in case subscription changes)
    plan: subscriptionPlanEnum('plan').notNull(),
    period: subscriptionPeriodEnum('period').notNull(),

    // Amount
    amountUsd: numeric('amount_usd', { precision: 10, scale: 2 }).notNull(),

    // NOWPayments references
    nowpaymentsPaymentId: text('nowpayments_payment_id').unique(),
    nowpaymentsOrderId: text('nowpayments_order_id'),
    paymentUrl: text('payment_url'),

    // Status
    status: paymentStatusEnum('status').notNull().default('waiting'),

    // Timestamps
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Indexes
    index('payments_subscription_id_idx').on(table.subscriptionId),
    index('payments_nowpayments_payment_id_idx').on(table.nowpaymentsPaymentId),
    index('payments_status_idx').on(table.status),

    // RLS Policies - Admin only

    // Admin can read payments
    pgPolicy('admin_read_payments', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'admin'`,
    }),

    // Admin can insert payments
    pgPolicy('admin_insert_payments', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`public.get_user_role() = 'admin'`,
    }),

    // Admin can update payments
    pgPolicy('admin_update_payments', {
      for: 'update',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'admin'`,
      withCheck: sql`public.get_user_role() = 'admin'`,
    }),

    // Admin can delete payments
    pgPolicy('admin_delete_payments', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'admin'`,
    }),
  ]
);


