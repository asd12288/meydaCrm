-- Import System V3: SSE Real-time updates and Leave-and-Return support
-- Supports: Supabase Realtime, UI state persistence, active imports tracking

-- ============================================================================
-- 1. NEW COLUMN: ui_state for leave-and-return functionality
-- ============================================================================

-- Store UI wizard state (current step, confirmed mappings, etc.)
ALTER TABLE "import_jobs" ADD COLUMN IF NOT EXISTS "ui_state" jsonb;

COMMENT ON COLUMN import_jobs.ui_state IS
  'Persisted UI state for leave-and-return: {currentStep, mappingConfirmed, optionsConfirmed, lastAccessedAt}';

-- ============================================================================
-- 2. ENABLE SUPABASE REALTIME for import_jobs
-- ============================================================================

-- Enable Realtime publication for import_jobs table
-- This allows SSE endpoint to subscribe to changes via Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE import_jobs;

-- ============================================================================
-- 3. INDEXES FOR ACTIVE IMPORTS QUERY
-- ============================================================================

-- Partial index for finding active imports (queued, parsing, validating, importing)
-- Used by the "Active Imports" indicator in the UI
CREATE INDEX IF NOT EXISTS "import_jobs_active_idx"
  ON "import_jobs" ("created_by", "status", "updated_at" DESC)
  WHERE "status" IN ('queued', 'pending', 'parsing', 'validating', 'ready', 'importing');

-- Index for SSE status queries (find job by ID with status)
CREATE INDEX IF NOT EXISTS "import_jobs_id_status_idx"
  ON "import_jobs" ("id", "status");

-- ============================================================================
-- 4. FUNCTION: Get active imports for a user
-- ============================================================================

-- Helper function to get all active imports for the current user
CREATE OR REPLACE FUNCTION public.get_active_imports()
RETURNS SETOF import_jobs
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM import_jobs
  WHERE created_by = auth.uid()
    AND status IN ('queued', 'pending', 'parsing', 'validating', 'ready', 'importing')
  ORDER BY updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_imports() TO authenticated;

COMMENT ON FUNCTION public.get_active_imports IS
  'Get all active (in-progress) import jobs for the current user. Used for the Active Imports indicator.';

-- ============================================================================
-- 5. FUNCTION: Update import progress (for workers)
-- ============================================================================

-- Optimized function for workers to update progress atomically
CREATE OR REPLACE FUNCTION public.update_import_progress(
  p_job_id uuid,
  p_status text DEFAULT NULL,
  p_processed_rows integer DEFAULT NULL,
  p_valid_rows integer DEFAULT NULL,
  p_invalid_rows integer DEFAULT NULL,
  p_imported_rows integer DEFAULT NULL,
  p_skipped_rows integer DEFAULT NULL,
  p_current_chunk integer DEFAULT NULL,
  p_total_chunks integer DEFAULT NULL,
  p_last_checkpoint jsonb DEFAULT NULL,
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE import_jobs
  SET
    status = COALESCE(p_status::import_status, status),
    processed_rows = COALESCE(p_processed_rows, processed_rows),
    valid_rows = COALESCE(p_valid_rows, valid_rows),
    invalid_rows = COALESCE(p_invalid_rows, invalid_rows),
    imported_rows = COALESCE(p_imported_rows, imported_rows),
    skipped_rows = COALESCE(p_skipped_rows, skipped_rows),
    current_chunk = COALESCE(p_current_chunk, current_chunk),
    total_chunks = COALESCE(p_total_chunks, total_chunks),
    last_checkpoint = COALESCE(p_last_checkpoint, last_checkpoint),
    error_message = COALESCE(p_error_message, error_message),
    updated_at = NOW(),
    started_at = CASE
      WHEN p_status = 'parsing' AND started_at IS NULL THEN NOW()
      ELSE started_at
    END,
    completed_at = CASE
      WHEN p_status IN ('completed', 'failed', 'cancelled') THEN NOW()
      ELSE completed_at
    END
  WHERE id = p_job_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_import_progress TO authenticated;

COMMENT ON FUNCTION public.update_import_progress IS
  'Atomic progress update for import workers. Triggers Realtime updates for SSE clients.';
