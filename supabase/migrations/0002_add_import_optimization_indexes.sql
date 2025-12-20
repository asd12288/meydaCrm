-- Add total_chunks column to import_jobs for progress tracking
ALTER TABLE "import_jobs" ADD COLUMN IF NOT EXISTS "total_chunks" integer;

-- Add indexes on leads for fast duplicate checking during imports
-- These indexes speed up duplicate detection for email and phone fields
CREATE INDEX IF NOT EXISTS "leads_email_idx" ON "leads" USING btree ("email") WHERE "email" IS NOT NULL AND "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "leads_phone_idx" ON "leads" USING btree ("phone") WHERE "phone" IS NOT NULL AND "deleted_at" IS NULL;

-- Add partial index on import_rows for faster valid row queries
CREATE INDEX IF NOT EXISTS "import_rows_job_valid_idx" ON "import_rows" USING btree ("import_job_id") WHERE "status" = 'valid';
