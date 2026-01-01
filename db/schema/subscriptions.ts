import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgPolicy,
  uuid,
  timestamp,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';
import {
  subscriptionPlanEnum,
  subscriptionPeriodEnum,
  subscriptionStatusEnum,
} from './enums';

/**
 * Subscriptions table - Global subscription for the CRM
 * Single row expected (one subscription for the entire application)
 */
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Subscription details
    plan: subscriptionPlanEnum('plan').notNull(),
    period: subscriptionPeriodEnum('period').notNull(),
    status: subscriptionStatusEnum('status').notNull().default('pending'),

    // Dates
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),

    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  () => [
    // RLS Policies - Admin only

    // Admin can read subscriptions
    pgPolicy('admin_read_subscriptions', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'admin'`,
    }),

    // Admin can insert subscriptions
    pgPolicy('admin_insert_subscriptions', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`public.get_user_role() = 'admin'`,
    }),

    // Admin can update subscriptions
    pgPolicy('admin_update_subscriptions', {
      for: 'update',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'admin'`,
      withCheck: sql`public.get_user_role() = 'admin'`,
    }),

    // Admin can delete subscriptions
    pgPolicy('admin_delete_subscriptions', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'admin'`,
    }),
  ]
);


