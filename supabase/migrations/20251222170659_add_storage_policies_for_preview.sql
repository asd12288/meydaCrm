-- Storage policies for imports bucket (admin only)
-- Using DO blocks to handle "already exists" gracefully

DO $$ BEGIN
  CREATE POLICY "Admin can upload import files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'imports'
    AND public.get_user_role() = 'admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin can read import files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'imports'
    AND public.get_user_role() = 'admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin can delete import files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'imports'
    AND public.get_user_role() = 'admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Storage policies for exports bucket
DO $$ BEGIN
  CREATE POLICY "admin_upload_exports"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'exports'
    AND public.get_user_role() = 'admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "admin_read_exports"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'exports'
    AND public.get_user_role() = 'admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "users_read_own_exports"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "admin_delete_exports"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'exports'
    AND public.get_user_role() = 'admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
