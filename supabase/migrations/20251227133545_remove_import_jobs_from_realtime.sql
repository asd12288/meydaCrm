-- Remove import_jobs from realtime publication
-- The SSE endpoint that used this was deleted (dead code)
-- Import progress now uses polling via server actions instead
-- This also helps eliminate 401 WebSocket errors since realtime is disabled at project level

-- Check if table is in publication before dropping (to avoid error if already removed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'import_jobs'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.import_jobs;
  END IF;
END $$;
