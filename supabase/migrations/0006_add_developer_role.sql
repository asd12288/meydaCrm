-- Add Developer Role Migration
-- Adds 'developer' role to user_role enum and updates RLS policies for ticket system

-- Add 'developer' to user_role enum
ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'developer';

-- RLS Policies for support_tickets (add developer read access)

-- Developer can read all tickets
CREATE POLICY "developer_read_all_tickets" ON "support_tickets"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (public.get_user_role() = 'developer');

-- RLS Policies for support_ticket_comments (add developer read, insert, update access)

-- Developer can read all comments on tickets they can access
CREATE POLICY "developer_read_ticket_comments" ON "support_ticket_comments"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (public.get_user_role() = 'developer');

-- Developer can insert comments
CREATE POLICY "developer_insert_ticket_comments" ON "support_ticket_comments"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK (public.get_user_role() = 'developer' AND "author_id" = (select auth.uid()));

-- Developer can update their own comments
CREATE POLICY "developer_update_own_comments" ON "support_ticket_comments"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING (public.get_user_role() = 'developer' AND "author_id" = (select auth.uid()))
  WITH CHECK (public.get_user_role() = 'developer' AND "author_id" = (select auth.uid()));
