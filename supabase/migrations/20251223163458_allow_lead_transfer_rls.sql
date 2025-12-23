-- Migration: allow_lead_transfer_rls
-- Purpose: Allow sales users to transfer leads to other sales users
--
-- The current WITH CHECK clause requires assigned_to = auth.uid(), which blocks transfers
-- because after transfer, assigned_to is the new user, not the current user.
--
-- Fix: Change WITH CHECK to allow assigned_to IS NOT NULL
-- This allows sales to transfer leads (change assigned_to) as long as:
-- 1. USING: They currently own the lead (assigned_to = auth.uid())
-- 2. WITH CHECK: The new assigned_to is not null (can't unassign)

-- Drop the old policy
DROP POLICY IF EXISTS "leads_update_policy" ON "public"."leads";

-- Create updated policy that allows transfers
CREATE POLICY "leads_update_policy" ON "public"."leads"
FOR UPDATE TO "authenticated"
USING (
  -- Can update if admin OR if lead is assigned to current user
  (SELECT public.get_user_role() AS get_user_role) = 'admin'::text
  OR assigned_to = auth.uid()
)
WITH CHECK (
  -- Admin can do anything
  (SELECT public.get_user_role() AS get_user_role) = 'admin'::text
  -- Sales can update as long as assigned_to remains non-null (can't unassign)
  OR assigned_to IS NOT NULL
);

-- Add comment explaining the policy
COMMENT ON POLICY "leads_update_policy" ON "public"."leads" IS
'Allows admin full update access. Sales users can update their assigned leads and transfer them to other users (assigned_to must remain non-null).';
