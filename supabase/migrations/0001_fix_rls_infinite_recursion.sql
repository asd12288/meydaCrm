-- Fix RLS infinite recursion in profiles policy
-- The original policy queried profiles table within a profiles RLS policy,
-- causing infinite recursion.
-- Solution: Create a SECURITY DEFINER function that bypasses RLS.

-- Create a SECURITY DEFINER function to get user role
-- This bypasses RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid()
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- Drop and recreate the profiles policies to use the new function
DROP POLICY IF EXISTS "admin_read_all_profiles" ON "profiles";
DROP POLICY IF EXISTS "admin_update_all_profiles" ON "profiles";

-- Recreate admin read policy using the helper function
CREATE POLICY "admin_read_all_profiles" ON "profiles"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (public.get_user_role() = 'admin');

-- Recreate admin update policy using the helper function
CREATE POLICY "admin_update_all_profiles" ON "profiles"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Also update the leads policies to use the function for consistency
DROP POLICY IF EXISTS "admin_read_all_leads" ON "leads";
DROP POLICY IF EXISTS "admin_insert_leads" ON "leads";
DROP POLICY IF EXISTS "admin_update_all_leads" ON "leads";
DROP POLICY IF EXISTS "admin_delete_leads" ON "leads";

CREATE POLICY "admin_read_all_leads" ON "leads"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (public.get_user_role() = 'admin');

CREATE POLICY "admin_insert_leads" ON "leads"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "admin_update_all_leads" ON "leads"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "admin_delete_leads" ON "leads"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING (public.get_user_role() = 'admin');

-- Update lead_comments policies
DROP POLICY IF EXISTS "admin_read_all_comments" ON "lead_comments";
DROP POLICY IF EXISTS "user_insert_comments" ON "lead_comments";
DROP POLICY IF EXISTS "admin_delete_any_comment" ON "lead_comments";

CREATE POLICY "admin_read_all_comments" ON "lead_comments"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (public.get_user_role() = 'admin');

CREATE POLICY "user_insert_comments" ON "lead_comments"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK (
    lead_comments.author_id = auth.uid() AND (
      public.get_user_role() = 'admin'
      OR EXISTS (
        SELECT 1 FROM leads
        WHERE leads.id = lead_comments.lead_id
        AND leads.assigned_to = auth.uid()
      )
    )
  );

CREATE POLICY "admin_delete_any_comment" ON "lead_comments"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING (public.get_user_role() = 'admin');

-- Update lead_history policies
DROP POLICY IF EXISTS "admin_read_all_history" ON "lead_history";
DROP POLICY IF EXISTS "user_insert_history" ON "lead_history";

CREATE POLICY "admin_read_all_history" ON "lead_history"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (public.get_user_role() = 'admin');

CREATE POLICY "user_insert_history" ON "lead_history"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK (
    lead_history.actor_id = auth.uid() AND (
      public.get_user_role() = 'admin'
      OR EXISTS (
        SELECT 1 FROM leads
        WHERE leads.id = lead_history.lead_id
        AND leads.assigned_to = auth.uid()
      )
    )
  );

-- Update import_jobs policies
DROP POLICY IF EXISTS "admin_read_import_jobs" ON "import_jobs";
DROP POLICY IF EXISTS "admin_insert_import_jobs" ON "import_jobs";
DROP POLICY IF EXISTS "admin_update_import_jobs" ON "import_jobs";

CREATE POLICY "admin_read_import_jobs" ON "import_jobs"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (public.get_user_role() = 'admin');

CREATE POLICY "admin_insert_import_jobs" ON "import_jobs"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK (public.get_user_role() = 'admin' AND import_jobs.created_by = auth.uid());

CREATE POLICY "admin_update_import_jobs" ON "import_jobs"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Update import_rows policies
DROP POLICY IF EXISTS "admin_read_import_rows" ON "import_rows";
DROP POLICY IF EXISTS "admin_insert_import_rows" ON "import_rows";
DROP POLICY IF EXISTS "admin_update_import_rows" ON "import_rows";

CREATE POLICY "admin_read_import_rows" ON "import_rows"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (public.get_user_role() = 'admin');

CREATE POLICY "admin_insert_import_rows" ON "import_rows"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "admin_update_import_rows" ON "import_rows"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');
