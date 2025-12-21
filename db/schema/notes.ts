import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgPolicy,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';
import { noteColorEnum } from './enums';
import { profiles } from './profiles';
import { leads } from './leads';

export const notes = pgTable(
  'notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Content
    title: text('title'), // Optional title
    content: text('content').notNull(), // Main note content (supports markdown)

    // Styling
    color: noteColorEnum('color').notNull().default('yellow'),

    // Organization
    position: integer('position').notNull().default(0), // For drag-and-drop ordering
    isPinned: boolean('is_pinned').notNull().default(false), // Pinned notes appear first

    // Free-form canvas positioning
    positionX: integer('position_x').notNull().default(100), // X coordinate on canvas
    positionY: integer('position_y').notNull().default(100), // Y coordinate on canvas
    width: integer('width').notNull().default(240), // Note width in pixels
    height: integer('height').notNull().default(200), // Note height in pixels
    zIndex: integer('z_index').notNull().default(0), // Stacking order (higher = on top)

    // Optional lead attachment
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),

    // Ownership (personal notes)
    createdBy: uuid('created_by')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

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
    index('notes_created_by_position_idx').on(table.createdBy, table.position),
    index('notes_created_by_pinned_idx').on(
      table.createdBy,
      table.isPinned,
      table.position
    ),
    index('notes_lead_id_idx').on(table.leadId),
    index('notes_created_by_z_index_idx').on(table.createdBy, table.zIndex),

    // RLS Policies - Personal notes (users can only access their own)

    // Users can only SELECT their own notes
    pgPolicy('users_read_own_notes', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.createdBy} = (select auth.uid())`,
    }),

    // Users can only INSERT their own notes
    pgPolicy('users_insert_own_notes', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.createdBy} = (select auth.uid())`,
    }),

    // Users can only UPDATE their own notes
    pgPolicy('users_update_own_notes', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.createdBy} = (select auth.uid())`,
      withCheck: sql`${table.createdBy} = (select auth.uid())`,
    }),

    // Users can only DELETE their own notes
    pgPolicy('users_delete_own_notes', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${table.createdBy} = (select auth.uid())`,
    }),
  ]
);
