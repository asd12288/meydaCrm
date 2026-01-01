import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgPolicy,
  uuid,
  text,
  timestamp,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';
import { profiles } from './profiles';

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // User who receives the notification
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    // Notification type
    type: text('type').notNull(), // 'lead_assigned', 'lead_comment', 'import_completed', 'import_failed', 'support_ticket', 'subscription_warning'

    // Display content (French)
    title: text('title').notNull(),
    message: text('message').notNull(),

    // Flexible metadata (lead_id, import_job_id, ticket_id, etc.)
    metadata: jsonb('metadata'),

    // Read status
    readAt: timestamp('read_at', { withTimezone: true }),

    // Action URL (optional link, e.g., '/leads/123')
    actionUrl: text('action_url'),

    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Indexes for performance
    index('notifications_user_created_idx').on(table.userId, table.createdAt),
    index('notifications_user_read_idx').on(table.userId, table.readAt),
    index('notifications_created_at_idx').on(table.createdAt),

    // RLS Policies

    // Users can only read their own notifications
    pgPolicy('users_read_own_notifications', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = (select auth.uid())`,
    }),

    // Only service_role can insert (via server actions with service role)
    // No insert policy for authenticated role - handled by server actions

    // Users can update their own notifications (to mark as read)
    pgPolicy('users_update_own_notifications', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.userId} = (select auth.uid())`,
      withCheck: sql`${table.userId} = (select auth.uid())`,
    }),

    // Users cannot delete notifications (system managed)
    // No delete policy for authenticated role
  ]
);


