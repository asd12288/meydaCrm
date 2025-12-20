import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgPolicy,
  uuid,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';
import { profiles } from './profiles';
import {
  supportTicketCategoryEnum,
  supportTicketStatusEnum,
} from './enums';

export const supportTickets = pgTable(
  'support_tickets',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    createdBy: uuid('created_by')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    category: supportTicketCategoryEnum('category').notNull(),
    subject: text('subject').notNull(),
    description: text('description').notNull(),
    status: supportTicketStatusEnum('status').notNull().default('open'),

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
    index('support_tickets_created_by_idx').on(table.createdBy),
    index('support_tickets_status_idx').on(table.status),
    index('support_tickets_category_idx').on(table.category),
    index('support_tickets_created_at_idx').on(table.createdAt),

    // RLS Policies - Admin only

    // Admin can read all tickets
    pgPolicy('admin_read_all_tickets', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'admin'`,
    }),

    // Admin can insert tickets
    pgPolicy('admin_insert_tickets', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`public.get_user_role() = 'admin' AND ${table.createdBy} = (select auth.uid())`,
    }),

    // Admin can update tickets
    pgPolicy('admin_update_tickets', {
      for: 'update',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'admin'`,
      withCheck: sql`public.get_user_role() = 'admin'`,
    }),

    // Admin can delete tickets
    pgPolicy('admin_delete_tickets', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'admin'`,
    }),

    // Developer can read all tickets
    pgPolicy('developer_read_all_tickets', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'developer'`,
    }),
  ]
);
