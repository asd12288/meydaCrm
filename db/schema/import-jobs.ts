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

// Type for assignment configuration
export interface AssignmentConfig {
  mode: 'none' | 'single' | 'round_robin' | 'by_column';
  singleUserId?: string;
  roundRobinUserIds?: string[];
  assignmentColumn?: string;
}

// Type for duplicate handling configuration
export interface DuplicateConfig {
  strategy: 'skip' | 'update' | 'create';
  checkFields: ('email' | 'phone' | 'external_id')[];
  checkDatabase: boolean;
  checkWithinFile: boolean;
}

// Type for checkpoint data
export interface ImportCheckpoint {
  chunkNumber: number;
  rowNumber: number;
  validCount: number;
  invalidCount: number;
  timestamp: string;
}

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
    totalChunks: integer('total_chunks'),

    // Column mapping configuration
    columnMapping: jsonb('column_mapping'),

    // V2: New columns for reliable imports
    // File hash for idempotency (prevent duplicate imports)
    fileHash: text('file_hash'),

    // Actual processed row count (not estimated)
    processedRows: integer('processed_rows').default(0),

    // Checkpoint for resume capability
    lastCheckpoint: jsonb('last_checkpoint').$type<ImportCheckpoint>(),

    // Path to error report CSV in Storage
    errorReportPath: text('error_report_path'),

    // Assignment configuration
    assignmentConfig: jsonb('assignment_config').$type<AssignmentConfig>(),

    // Duplicate handling configuration
    duplicateConfig: jsonb('duplicate_config').$type<DuplicateConfig>(),

    // QStash worker ID for tracking
    workerId: text('worker_id'),

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
    // Indexes
    index('import_jobs_created_by_idx').on(table.createdBy),
    index('import_jobs_status_idx').on(table.status),
    index('import_jobs_created_at_idx').on(table.createdAt),
    index('import_jobs_file_hash_idx').on(table.fileHash),
    index('import_jobs_worker_id_idx').on(table.workerId),

    // RLS Policies - Only admin can access import jobs
    // NOTE: These use public.get_user_role() to avoid infinite recursion
    // The actual policies are created in migrations/0001_fix_rls_infinite_recursion.sql

    pgPolicy('admin_read_import_jobs', {
      for: 'select',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'admin'`,
    }),

    pgPolicy('admin_insert_import_jobs', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`public.get_user_role() = 'admin' AND ${table.createdBy} = auth.uid()`,
    }),

    pgPolicy('admin_update_import_jobs', {
      for: 'update',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'admin'`,
      withCheck: sql`public.get_user_role() = 'admin'`,
    }),

    pgPolicy('admin_delete_import_jobs', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`public.get_user_role() = 'admin'`,
    }),
  ]
);
