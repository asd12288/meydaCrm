import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgPolicy,
  uuid,
  text,
  timestamp,
  index,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';
import { profiles } from './profiles';
import { importStatusEnum } from './enums';

export const importJobs = pgTable(
  'import_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Who initiated the import
    createdBy: uuid('created_by')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    // File information
    fileName: text('file_name').notNull(),
    fileType: text('file_type').notNull(), // 'csv' or 'xlsx'
    storagePath: text('storage_path').notNull(), // Supabase Storage path

    // Status and progress
    status: importStatusEnum('status').notNull().default('pending'),

    // Row counts
    totalRows: integer('total_rows'),
    validRows: integer('valid_rows'),
    invalidRows: integer('invalid_rows'),
    importedRows: integer('imported_rows'),
    skippedRows: integer('skipped_rows'),

    // Current processing position (for resumability)
    currentChunk: integer('current_chunk').default(0),

    // Column mapping configuration
    columnMapping: jsonb('column_mapping'),

    // Error information
    errorMessage: text('error_message'),
    errorDetails: jsonb('error_details'),

    // Timestamps
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('import_jobs_created_by_idx').on(table.createdBy),
    index('import_jobs_status_idx').on(table.status),
    index('import_jobs_created_at_idx').on(table.createdAt),

    // RLS Policies - Only admin can access import jobs

    pgPolicy('admin_read_import_jobs', {
      for: 'select',
      to: authenticatedRole,
      using: sql`(
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin'`,
    }),

    pgPolicy('admin_insert_import_jobs', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`(
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin' AND ${table.createdBy} = (select auth.uid())`,
    }),

    pgPolicy('admin_update_import_jobs', {
      for: 'update',
      to: authenticatedRole,
      using: sql`(
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin'`,
      withCheck: sql`(
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin'`,
    }),
  ]
);
