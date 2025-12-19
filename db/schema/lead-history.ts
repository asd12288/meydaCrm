import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgPolicy,
  uuid,
  timestamp,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';
import { profiles } from './profiles';
import { leads } from './leads';
import { historyEventTypeEnum } from './enums';

export const leadHistory = pgTable(
  'lead_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),

    actorId: uuid('actor_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),

    eventType: historyEventTypeEnum('event_type').notNull(),

    // Store before/after state as JSON for audit trail
    beforeData: jsonb('before_data'),
    afterData: jsonb('after_data'),

    // Additional context (e.g., import job ID, comment ID)
    metadata: jsonb('metadata'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('lead_history_lead_id_idx').on(table.leadId),
    index('lead_history_actor_id_idx').on(table.actorId),
    index('lead_history_event_type_idx').on(table.eventType),
    index('lead_history_created_at_idx').on(table.createdAt),

    // RLS Policies

    // Admin can read all history
    pgPolicy('admin_read_all_history', {
      for: 'select',
      to: authenticatedRole,
      using: sql`(
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin'`,
    }),

    // Sales can read history for assigned leads
    pgPolicy('sales_read_assigned_lead_history', {
      for: 'select',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM leads
        WHERE leads.id = ${table.leadId}
        AND leads.assigned_to = (select auth.uid())
      )`,
    }),

    // Insert allowed for authenticated users (controlled by application logic)
    // History is append-only - no update or delete policies for authenticated role
    pgPolicy('user_insert_history', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`
        ${table.actorId} = (select auth.uid()) AND (
          (SELECT role FROM profiles WHERE id = (select auth.uid())) = 'admin'
          OR EXISTS (
            SELECT 1 FROM leads
            WHERE leads.id = ${table.leadId}
            AND leads.assigned_to = (select auth.uid())
          )
        )
      `,
    }),
  ]
);
