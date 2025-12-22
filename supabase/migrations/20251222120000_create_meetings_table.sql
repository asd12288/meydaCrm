-- Migration: create_meetings_table
-- Creates the meetings table for scheduling meetings with leads

-- Create meeting status enum
CREATE TYPE meeting_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- Create meetings table
CREATE TABLE meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core fields
  title text NOT NULL,
  description text,
  location text,

  -- Scheduling
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,

  -- Relationships
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assigned_to uuid NOT NULL REFERENCES profiles(id),
  created_by uuid NOT NULL REFERENCES profiles(id),

  -- Status
  status meeting_status NOT NULL DEFAULT 'scheduled',
  outcome_notes text,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin can do everything
CREATE POLICY admin_all_meetings ON meetings
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin');

-- Sales can read their own meetings
CREATE POLICY sales_read_own_meetings ON meetings
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());

-- Sales can insert their own meetings
CREATE POLICY sales_insert_own_meetings ON meetings
  FOR INSERT TO authenticated
  WITH CHECK (assigned_to = auth.uid() AND created_by = auth.uid());

-- Sales can update their own meetings
CREATE POLICY sales_update_own_meetings ON meetings
  FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid());

-- Sales can delete their own meetings
CREATE POLICY sales_delete_own_meetings ON meetings
  FOR DELETE TO authenticated
  USING (assigned_to = auth.uid());

-- Indexes for performance
CREATE INDEX meetings_assigned_to_scheduled_start_idx ON meetings(assigned_to, scheduled_start);
CREATE INDEX meetings_lead_id_idx ON meetings(lead_id);
CREATE INDEX meetings_status_idx ON meetings(status);
CREATE INDEX meetings_scheduled_start_idx ON meetings(scheduled_start);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_meetings_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.update_meetings_updated_at() OWNER TO postgres;

-- Updated_at trigger
CREATE TRIGGER meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_meetings_updated_at();

-- Grant function permissions
GRANT ALL ON FUNCTION public.update_meetings_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_meetings_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_meetings_updated_at() TO service_role;
