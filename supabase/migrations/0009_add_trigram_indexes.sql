-- Migration: Add trigram indexes for fast text search
-- This enables efficient ILIKE searches on leads table (290k+ rows)
-- Using pg_trgm extension with GIN indexes as recommended by PostgreSQL docs

-- Enable pg_trgm extension (pre-installed in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for leads text search
-- These indexes support ILIKE with leading wildcards (%term%)
-- Using partial indexes (WHERE deleted_at IS NULL) to reduce index size
-- Note: Not using CONCURRENTLY as it cannot run in a transaction block

-- Index on first_name for name searches
CREATE INDEX IF NOT EXISTS leads_first_name_trgm_idx 
  ON leads USING gin (first_name gin_trgm_ops) 
  WHERE deleted_at IS NULL;

-- Index on last_name for name searches
CREATE INDEX IF NOT EXISTS leads_last_name_trgm_idx 
  ON leads USING gin (last_name gin_trgm_ops) 
  WHERE deleted_at IS NULL;

-- Index on email for email searches
CREATE INDEX IF NOT EXISTS leads_email_trgm_idx 
  ON leads USING gin (email gin_trgm_ops) 
  WHERE deleted_at IS NULL AND email IS NOT NULL;

-- Index on company for company searches
CREATE INDEX IF NOT EXISTS leads_company_trgm_idx 
  ON leads USING gin (company gin_trgm_ops) 
  WHERE deleted_at IS NULL;

-- Index on phone for phone searches
CREATE INDEX IF NOT EXISTS leads_phone_trgm_idx 
  ON leads USING gin (phone gin_trgm_ops) 
  WHERE deleted_at IS NULL AND phone IS NOT NULL;
