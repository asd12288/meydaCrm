import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgPolicy,
  pgEnum,
  uuid,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';
import { profiles } from './profiles';
import { leads } from './leads';

// Meeting status enum
export const meetingStatusEnum = pgEnum('meeting_status', [
  'scheduled',
  'completed',
  'cancelled',
  'no_show',
]);

export const meetings = pgTable(
  'meetings',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Core fields
    title: text('title').notNull(),
    description: text('description'),
    location: text('location'),

    // Scheduling
    scheduledStart: timestamp('scheduled_start', { withTimezone: true }).notNull(),
    scheduledEnd: timestamp('scheduled_end', { withTimezone: true }).notNull(),

    // Relationships
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    assignedTo: uuid('assigned_to')
      .notNull()
      .references(() => profiles.id),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => profiles.id),

    // Status
    status: meetingStatusEnum('status').notNull().default('scheduled'),
    outcomeNotes: text('outcome_notes'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Performance indexes
    index('meetings_assigned_to_scheduled_start_idx').on(
      table.assignedTo,
      table.scheduledStart
    ),
    index('meetings_lead_id_idx').on(table.leadId),
    index('meetings_status_idx').on(table.status),
    index('meetings_scheduled_start_idx').on(table.scheduledStart),

    // RLS Policies

    // Admin can do everything
    pgPolicy('admin_all_meetings', {
      for: 'all',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'admin'`,
    }),

    // Sales can read their own meetings
    pgPolicy('sales_read_own_meetings', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.assignedTo} = (select auth.uid())`,
    }),

    // Sales can insert their own meetings
    pgPolicy('sales_insert_own_meetings', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.assignedTo} = (select auth.uid()) AND ${table.createdBy} = (select auth.uid())`,
    }),

    // Sales can update their own meetings
    pgPolicy('sales_update_own_meetings', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.assignedTo} = (select auth.uid())`,
    }),

    // Sales can delete their own meetings
    pgPolicy('sales_delete_own_meetings', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${table.assignedTo} = (select auth.uid())`,
    }),
  ]
);
