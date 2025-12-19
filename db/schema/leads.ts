import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgPolicy,
  uuid,
  text,
  timestamp,
  index,
  varchar,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';
import { leadStatusEnum } from './enums';
import { profiles } from './profiles';

export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Core lead fields
    externalId: text('external_id'), // ID from imported file
    firstName: text('first_name'),
    lastName: text('last_name'),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    company: text('company'),
    jobTitle: text('job_title'),

    // Address fields
    address: text('address'),
    city: text('city'),
    postalCode: varchar('postal_code', { length: 20 }),
    country: text('country').default('France'),

    // Lead management
    status: leadStatusEnum('status').notNull().default('new'),
    statusLabel: text('status_label').notNull().default('Nouveau'), // French display
    source: text('source'), // Origin of the lead (import file, manual, etc.)
    notes: text('notes'),

    // Assignment
    assignedTo: uuid('assigned_to').references(() => profiles.id, {
      onDelete: 'set null',
    }),

    // Soft delete
    deletedAt: timestamp('deleted_at', { withTimezone: true }),

    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),

    // Import tracking
    importJobId: uuid('import_job_id'),
  },
  (table) => [
    // Performance indexes (from CLAUDE.md requirements)
    index('leads_assigned_updated_idx').on(table.assignedTo, table.updatedAt),
    index('leads_assigned_status_idx').on(table.assignedTo, table.status),
    index('leads_external_id_idx').on(table.externalId),
    index('leads_deleted_at_idx').on(table.deletedAt),

    // RLS Policies

    // Admin can read all leads
    pgPolicy('admin_read_all_leads', {
      for: 'select',
      to: authenticatedRole,
      using: sql`(
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin'`,
    }),

    // Sales can only read assigned leads
    pgPolicy('sales_read_assigned_leads', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.assignedTo} = (select auth.uid())`,
    }),

    // Admin can insert leads
    pgPolicy('admin_insert_leads', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`(
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin'`,
    }),

    // Admin can update all leads
    pgPolicy('admin_update_all_leads', {
      for: 'update',
      to: authenticatedRole,
      using: sql`(
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin'`,
      withCheck: sql`(
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin'`,
    }),

    // Sales can update assigned leads
    pgPolicy('sales_update_assigned_leads', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.assignedTo} = (select auth.uid())`,
      withCheck: sql`${table.assignedTo} = (select auth.uid())`,
    }),

    // Only admin can delete (soft delete)
    pgPolicy('admin_delete_leads', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`(
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin'`,
    }),
  ]
);
