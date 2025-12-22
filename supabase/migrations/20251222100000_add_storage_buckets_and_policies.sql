-- =============================================================================
-- Migration: add_storage_buckets_and_policies
-- Purpose: Create storage buckets and RLS policies for preview branches
-- Note: Uses ON CONFLICT DO NOTHING / IF NOT EXISTS for idempotency
-- =============================================================================

-- =============================================================================
-- SECTION 1: Create Storage Buckets (if not exist)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('imports', 'imports', false, 52428800, ARRAY['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']),
  ('exports', 'exports', false, 52428800, ARRAY['text/csv']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SECTION 2: Storage RLS Policies for 'imports' bucket
-- =============================================================================

-- Admin can upload import files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Admin can upload import files'
  ) THEN
    CREATE POLICY "Admin can upload import files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'imports'
      AND public.get_user_role() = 'admin'
    );
  END IF;
END $$;

-- Admin can read import files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Admin can read import files'
  ) THEN
    CREATE POLICY "Admin can read import files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'imports'
      AND public.get_user_role() = 'admin'
    );
  END IF;
END $$;

-- Admin can delete import files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Admin can delete import files'
  ) THEN
    CREATE POLICY "Admin can delete import files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'imports'
      AND public.get_user_role() = 'admin'
    );
  END IF;
END $$;

-- =============================================================================
-- SECTION 3: Storage RLS Policies for 'exports' bucket
-- =============================================================================

-- Admin can upload export files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'admin_upload_exports'
  ) THEN
    CREATE POLICY "admin_upload_exports"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'exports'
      AND public.get_user_role() = 'admin'
    );
  END IF;
END $$;

-- Admin can read all export files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'admin_read_exports'
  ) THEN
    CREATE POLICY "admin_read_exports"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'exports'
      AND public.get_user_role() = 'admin'
    );
  END IF;
END $$;

-- Admin can delete export files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'admin_delete_exports'
  ) THEN
    CREATE POLICY "admin_delete_exports"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'exports'
      AND public.get_user_role() = 'admin'
    );
  END IF;
END $$;

-- Users can read their own export files (by path pattern: user_id/filename)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'users_read_own_exports'
  ) THEN
    CREATE POLICY "users_read_own_exports"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'exports'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- =============================================================================
-- SECTION 4: Storage RLS Policies for 'avatars' bucket (public read)
-- =============================================================================

-- Anyone can read avatars (public bucket)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Public can read avatars'
  ) THEN
    CREATE POLICY "Public can read avatars"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'avatars');
  END IF;
END $$;

-- Admin can upload avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Admin can upload avatars'
  ) THEN
    CREATE POLICY "Admin can upload avatars"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars'
      AND public.get_user_role() = 'admin'
    );
  END IF;
END $$;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
