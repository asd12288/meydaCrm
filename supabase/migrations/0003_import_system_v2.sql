-- Import System V2: Enhanced columns for reliable large-scale imports
-- Supports: file deduplication, checkpoint recovery, error reports, QStash integration

-- ============================================================================
-- 1. NEW COLUMNS FOR import_jobs
-- ============================================================================

-- File hash for idempotency (prevent duplicate imports of same file)
ALTER TABLE "import_jobs" ADD COLUMN IF NOT EXISTS "file_hash" text;

-- Actual processed row count (not estimated)
ALTER TABLE "import_jobs" ADD COLUMN IF NOT EXISTS "processed_rows" integer DEFAULT 0;

-- Checkpoint for resume capability (JSON with chunk/row position)
ALTER TABLE "import_jobs" ADD COLUMN IF NOT EXISTS "last_checkpoint" jsonb;

-- Path to error report CSV in Storage
ALTER TABLE "import_jobs" ADD COLUMN IF NOT EXISTS "error_report_path" text;

-- Store assignment configuration
ALTER TABLE "import_jobs" ADD COLUMN IF NOT EXISTS "assignment_config" jsonb;

-- Store duplicate handling configuration
ALTER TABLE "import_jobs" ADD COLUMN IF NOT EXISTS "duplicate_config" jsonb;

-- QStash message ID for tracking
ALTER TABLE "import_jobs" ADD COLUMN IF NOT EXISTS "worker_id" text;

-- ============================================================================
-- 2. NEW INDEXES
-- ============================================================================

-- Index for idempotency check (find existing imports of same file)
CREATE INDEX IF NOT EXISTS "import_jobs_file_hash_idx"
  ON "import_jobs" ("file_hash")
  WHERE "file_hash" IS NOT NULL;

-- Index for finding imports by worker ID
CREATE INDEX IF NOT EXISTS "import_jobs_worker_id_idx"
  ON "import_jobs" ("worker_id")
  WHERE "worker_id" IS NOT NULL;

-- Partial index on leads for lowercase email (better for duplicate checking)
CREATE INDEX IF NOT EXISTS "leads_email_lower_idx"
  ON "leads" (LOWER("email"))
  WHERE "email" IS NOT NULL AND "deleted_at" IS NULL;

-- Index on leads for external_id duplicate checking
CREATE INDEX IF NOT EXISTS "leads_external_id_idx"
  ON "leads" ("external_id")
  WHERE "external_id" IS NOT NULL AND "deleted_at" IS NULL;

-- ============================================================================
-- 3. ADD DELETE POLICY FOR import_rows (for cleanup)
-- ============================================================================

-- Allow admins to delete import rows (for cleanup after import)
DROP POLICY IF EXISTS "admin_delete_import_rows" ON "import_rows";
CREATE POLICY "admin_delete_import_rows" ON "import_rows"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING (public.get_user_role() = 'admin');

-- Allow admins to delete import jobs
DROP POLICY IF EXISTS "admin_delete_import_jobs" ON "import_jobs";
CREATE POLICY "admin_delete_import_jobs" ON "import_jobs"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING (public.get_user_role() = 'admin');

-- ============================================================================
-- 4. NEW STATUS VALUE: 'queued' for QStash jobs
-- ============================================================================

-- Add 'queued' to import_status enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'queued'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'import_status')
  ) THEN
    ALTER TYPE "import_status" ADD VALUE 'queued' BEFORE 'parsing';
  END IF;
END$$;

-- Add 'cancelled' status for cancelled jobs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'cancelled'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'import_status')
  ) THEN
    ALTER TYPE "import_status" ADD VALUE 'cancelled';
  END IF;
END$$;

-- ============================================================================
-- 5. FUNCTION: Calculate file hash (for use in trigger or application)
-- ============================================================================

-- Helper function to check if file was already imported
CREATE OR REPLACE FUNCTION public.check_duplicate_import(p_file_hash text)
RETURNS TABLE(job_id uuid, status text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, status::text, created_at
  FROM import_jobs
  WHERE file_hash = p_file_hash
    AND status IN ('completed', 'importing', 'ready', 'parsing', 'queued')
  ORDER BY created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.check_duplicate_import(text) TO authenticated;

COMMENT ON FUNCTION public.check_duplicate_import IS
  'Check if a file with the given hash was already imported. Returns the existing job if found.';
