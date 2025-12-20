import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgPolicy,
  uuid,
  integer,
  timestamp,
  index,
  jsonb,
  text,
} from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';
import { importJobs } from './import-jobs';
import { importRowStatusEnum } from './enums';

export const importRows = pgTable(
  'import_rows',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    importJobId: uuid('import_job_id')
      .notNull()
      .references(() => importJobs.id, { onDelete: 'cascade' }),

    // Row position in the file (for resumability)
    rowNumber: integer('row_number').notNull(),
    chunkNumber: integer('chunk_number').notNull(),

    // Status
    status: importRowStatusEnum('status').notNull().default('pending'),

    // Raw data from the file
    rawData: jsonb('raw_data').notNull(),

    // Normalized/validated data ready for insert
    normalizedData: jsonb('normalized_data'),

    // Validation errors
    validationErrors: jsonb('validation_errors'),

    // Link to created lead (if imported)
    leadId: uuid('lead_id'),

    // Processing info
    errorMessage: text('error_message'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('import_rows_job_id_idx').on(table.importJobId),
    index('import_rows_status_idx').on(table.status),
    index('import_rows_job_chunk_idx').on(table.importJobId, table.chunkNumber),

    // RLS Policies - Only admin can access import rows
    // NOTE: These use public.get_user_role() to avoid infinite recursion

    pgPolicy('admin_read_import_rows', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'admin'`,
    }),

    pgPolicy('admin_insert_import_rows', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`public.get_user_role() = 'admin'`,
    }),

    pgPolicy('admin_update_import_rows', {
      for: 'update',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'admin'`,
      withCheck: sql`public.get_user_role() = 'admin'`,
    }),

    pgPolicy('admin_delete_import_rows', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'admin'`,
    }),
  ]
);
