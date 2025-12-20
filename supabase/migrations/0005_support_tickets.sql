-- Support Tickets System Migration
-- Adds support_tickets and support_ticket_comments tables for admin support system

-- Create support ticket category enum
CREATE TYPE "public"."support_ticket_category" AS ENUM('bug', 'feature', 'payment_issue', 'feedback');

-- Create support ticket status enum
CREATE TYPE "public"."support_ticket_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');

-- Create support_tickets table
CREATE TABLE "support_tickets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_by" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "category" "support_ticket_category" NOT NULL,
  "subject" text NOT NULL,
  "description" text NOT NULL,
  "status" "support_ticket_status" DEFAULT 'open' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on support_tickets
ALTER TABLE "support_tickets" ENABLE ROW LEVEL SECURITY;

-- Create support_ticket_comments table
CREATE TABLE "support_ticket_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "ticket_id" uuid NOT NULL REFERENCES "support_tickets"("id") ON DELETE CASCADE,
  "author_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "body" text NOT NULL,
  "is_internal" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on support_ticket_comments
ALTER TABLE "support_ticket_comments" ENABLE ROW LEVEL SECURITY;

-- Create indexes for support_tickets
CREATE INDEX "support_tickets_created_by_idx" ON "support_tickets" USING btree ("created_by");
CREATE INDEX "support_tickets_status_idx" ON "support_tickets" USING btree ("status");
CREATE INDEX "support_tickets_category_idx" ON "support_tickets" USING btree ("category");
CREATE INDEX "support_tickets_created_at_idx" ON "support_tickets" USING btree ("created_at");

-- Create indexes for support_ticket_comments
CREATE INDEX "support_ticket_comments_ticket_id_idx" ON "support_ticket_comments" USING btree ("ticket_id");
CREATE INDEX "support_ticket_comments_created_at_idx" ON "support_ticket_comments" USING btree ("created_at");

-- RLS Policies for support_tickets (admin-only)
CREATE POLICY "admin_read_all_tickets" ON "support_tickets"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (public.get_user_role() = 'admin');

CREATE POLICY "admin_insert_tickets" ON "support_tickets"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK (public.get_user_role() = 'admin' AND "created_by" = (select auth.uid()));

CREATE POLICY "admin_update_tickets" ON "support_tickets"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "admin_delete_tickets" ON "support_tickets"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING (public.get_user_role() = 'admin');

-- RLS Policies for support_ticket_comments (admin-only)
CREATE POLICY "admin_read_ticket_comments" ON "support_ticket_comments"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (public.get_user_role() = 'admin');

CREATE POLICY "admin_insert_ticket_comments" ON "support_ticket_comments"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK (public.get_user_role() = 'admin' AND "author_id" = (select auth.uid()));

CREATE POLICY "admin_update_own_comments" ON "support_ticket_comments"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING (public.get_user_role() = 'admin' AND "author_id" = (select auth.uid()))
  WITH CHECK (public.get_user_role() = 'admin' AND "author_id" = (select auth.uid()));

CREATE POLICY "admin_delete_ticket_comments" ON "support_ticket_comments"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING (public.get_user_role() = 'admin');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON "support_tickets"
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();

CREATE OR REPLACE FUNCTION update_support_ticket_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER support_ticket_comments_updated_at
  BEFORE UPDATE ON "support_ticket_comments"
  FOR EACH ROW
  EXECUTE FUNCTION update_support_ticket_comments_updated_at();
