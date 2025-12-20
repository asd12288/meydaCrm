import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgPolicy,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';
import { profiles } from './profiles';
import { supportTickets } from './support-tickets';

export const supportTicketComments = pgTable(
  'support_ticket_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => supportTickets.id, { onDelete: 'cascade' }),

    authorId: uuid('author_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    body: text('body').notNull(),

    isInternal: boolean('is_internal').notNull().default(false),

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
    index('support_ticket_comments_ticket_id_idx').on(table.ticketId),
    index('support_ticket_comments_created_at_idx').on(table.createdAt),

    // RLS Policies - Admin only

    // Admin can read all comments on tickets they can access
    pgPolicy('admin_read_ticket_comments', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'admin'`,
    }),

    // Admin can insert comments
    pgPolicy('admin_insert_ticket_comments', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`public.get_user_role() = 'admin' AND ${table.authorId} = (select auth.uid())`,
    }),

    // Admin can update their own comments
    pgPolicy('admin_update_own_comments', {
      for: 'update',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'admin' AND ${table.authorId} = (select auth.uid())`,
      withCheck: sql`public.get_user_role() = 'admin' AND ${table.authorId} = (select auth.uid())`,
    }),

    // Admin can delete comments
    pgPolicy('admin_delete_ticket_comments', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'admin'`,
    }),

    // Developer can read all comments on tickets they can access
    pgPolicy('developer_read_ticket_comments', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'developer'`,
    }),

    // Developer can insert comments
    pgPolicy('developer_insert_ticket_comments', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`public.get_user_role() = 'developer' AND ${table.authorId} = (select auth.uid())`,
    }),

    // Developer can update their own comments
    pgPolicy('developer_update_own_comments', {
      for: 'update',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'developer' AND ${table.authorId} = (select auth.uid())`,
      withCheck: sql`public.get_user_role() = 'developer' AND ${table.authorId} = (select auth.uid())`,
    }),
  ]
);
