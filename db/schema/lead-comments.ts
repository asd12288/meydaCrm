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
import { leads } from './leads';

export const leadComments = pgTable(
  'lead_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),

    authorId: uuid('author_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    body: text('body').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('lead_comments_lead_id_idx').on(table.leadId),
    index('lead_comments_author_id_idx').on(table.authorId),
    index('lead_comments_created_at_idx').on(table.createdAt),

    // RLS Policies

    // Admin can read all comments
    pgPolicy('admin_read_all_comments', {
      for: 'select',
      to: authenticatedRole,
      using: sql`(
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin'`,
    }),

    // Sales can read comments on their assigned leads
    pgPolicy('sales_read_assigned_lead_comments', {
      for: 'select',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM leads
        WHERE leads.id = ${table.leadId}
        AND leads.assigned_to = (select auth.uid())
      )`,
    }),

    // Users can insert comments on leads they can access
    pgPolicy('user_insert_comments', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`
        ${table.authorId} = (select auth.uid()) AND (
          (SELECT role FROM profiles WHERE id = (select auth.uid())) = 'admin'
          OR EXISTS (
            SELECT 1 FROM leads
            WHERE leads.id = ${table.leadId}
            AND leads.assigned_to = (select auth.uid())
          )
        )
      `,
    }),

    // Users can update their own comments
    pgPolicy('user_update_own_comments', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.authorId} = (select auth.uid())`,
      withCheck: sql`${table.authorId} = (select auth.uid())`,
    }),

    // Admin can delete any comment
    pgPolicy('admin_delete_any_comment', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`(
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin'`,
    }),

    // Users can delete their own comments
    pgPolicy('user_delete_own_comment', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${table.authorId} = (select auth.uid())`,
    }),
  ]
);
