-- Migration: Add storage buckets and policies
-- These were missing from original migrations (added directly to production)
-- This migration ensures local dev has the same storage setup as production

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================

-- Create imports bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'imports',
  'imports',
  false,
  104857600, -- 100MB
  ARRAY['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
)
ON CONFLICT (id) DO NOTHING;

-- Create exports bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exports',
  'exports',
  false,
  104857600, -- 100MB
  ARRAY['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STORAGE POLICIES - IMPORTS BUCKET
-- =============================================================================

-- Admin can upload import files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND policyname = 'Admin can upload import files'
  ) THEN
    CREATE POLICY "Admin can upload import files" ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'imports'
        AND get_user_role() = 'admin'
      );
  END IF;
END $$;

-- Admin can read import files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND policyname = 'Admin can read import files'
  ) THEN
    CREATE POLICY "Admin can read import files" ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'imports'
        AND get_user_role() = 'admin'
      );
  END IF;
END $$;

-- Admin can delete import files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND policyname = 'Admin can delete import files'
  ) THEN
    CREATE POLICY "Admin can delete import files" ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'imports'
        AND get_user_role() = 'admin'
      );
  END IF;
END $$;

-- =============================================================================
-- STORAGE POLICIES - EXPORTS BUCKET
-- =============================================================================

-- Admin can upload to exports bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND policyname = 'admin_upload_exports'
  ) THEN
    CREATE POLICY "admin_upload_exports" ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'exports'
        AND get_user_role() = 'admin'
      );
  END IF;
END $$;

-- Admin can read all exports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND policyname = 'admin_read_exports'
  ) THEN
    CREATE POLICY "admin_read_exports" ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'exports'
        AND get_user_role() = 'admin'
      );
  END IF;
END $$;

-- Admin can delete exports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND policyname = 'admin_delete_exports'
  ) THEN
    CREATE POLICY "admin_delete_exports" ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'exports'
        AND get_user_role() = 'admin'
      );
  END IF;
END $$;

-- Users can read their own exports (folder = user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND policyname = 'users_read_own_exports'
  ) THEN
    CREATE POLICY "users_read_own_exports" ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'exports'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;
