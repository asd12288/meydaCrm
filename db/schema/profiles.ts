import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgPolicy,
  uuid,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { authenticatedRole, authUsers } from 'drizzle-orm/supabase';
import { userRoleEnum } from './enums';

export const profiles = pgTable(
  'profiles',
  {
    // Primary key matches auth.users.id
    id: uuid('id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),

    role: userRoleEnum('role').notNull().default('sales'),
    displayName: text('display_name').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Index for role lookups
    index('profiles_role_idx').on(table.role),

    // RLS Policies

    // Admin can read all profiles
    pgPolicy('admin_read_all_profiles', {
      for: 'select',
      to: authenticatedRole,
      using: sql`(
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin'`,
    }),

    // Users can read their own profile
    pgPolicy('user_read_own_profile', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.id} = (select auth.uid())`,
    }),

    // Admin can update all profiles
    pgPolicy('admin_update_all_profiles', {
      for: 'update',
      to: authenticatedRole,
      using: sql`(
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin'`,
      withCheck: sql`(
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin'`,
    }),

    // Users can update their own profile (display_name only, role protected by app logic)
    pgPolicy('user_update_own_profile', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.id} = (select auth.uid())`,
      withCheck: sql`${table.id} = (select auth.uid())`,
    }),

    // Only service_role can insert (via Edge Functions)
    // No insert policy for authenticated role - handled by admin-create-user Edge Function
  ]
);
