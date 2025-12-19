CREATE TYPE "public"."history_event_type" AS ENUM('created', 'updated', 'assigned', 'status_changed', 'imported', 'comment_added');--> statement-breakpoint
CREATE TYPE "public"."import_row_status" AS ENUM('pending', 'valid', 'invalid', 'imported', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."import_status" AS ENUM('pending', 'parsing', 'validating', 'ready', 'importing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'no_answer');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'sales');--> statement-breakpoint
-- Note: auth.users table is managed by Supabase Auth, not created here
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"role" "user_role" DEFAULT 'sales' NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text,
	"first_name" text,
	"last_name" text,
	"email" varchar(255),
	"phone" varchar(50),
	"company" text,
	"job_title" text,
	"address" text,
	"city" text,
	"postal_code" varchar(20),
	"country" text DEFAULT 'France',
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"status_label" text DEFAULT 'Nouveau' NOT NULL,
	"source" text,
	"notes" text,
	"assigned_to" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"import_job_id" uuid
);
--> statement-breakpoint
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "lead_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_comments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "lead_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"actor_id" uuid,
	"event_type" "history_event_type" NOT NULL,
	"before_data" jsonb,
	"after_data" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "import_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"storage_path" text NOT NULL,
	"status" "import_status" DEFAULT 'pending' NOT NULL,
	"total_rows" integer,
	"valid_rows" integer,
	"invalid_rows" integer,
	"imported_rows" integer,
	"skipped_rows" integer,
	"current_chunk" integer DEFAULT 0,
	"column_mapping" jsonb,
	"error_message" text,
	"error_details" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "import_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "import_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_job_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"chunk_number" integer NOT NULL,
	"status" "import_row_status" DEFAULT 'pending' NOT NULL,
	"raw_data" jsonb NOT NULL,
	"normalized_data" jsonb,
	"validation_errors" jsonb,
	"lead_id" uuid,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "import_rows" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_profiles_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_comments" ADD CONSTRAINT "lead_comments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_comments" ADD CONSTRAINT "lead_comments_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_history" ADD CONSTRAINT "lead_history_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_history" ADD CONSTRAINT "lead_history_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_import_job_id_import_jobs_id_fk" FOREIGN KEY ("import_job_id") REFERENCES "public"."import_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profiles_role_idx" ON "profiles" USING btree ("role");--> statement-breakpoint
CREATE INDEX "leads_assigned_updated_idx" ON "leads" USING btree ("assigned_to","updated_at");--> statement-breakpoint
CREATE INDEX "leads_assigned_status_idx" ON "leads" USING btree ("assigned_to","status");--> statement-breakpoint
CREATE INDEX "leads_external_id_idx" ON "leads" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "leads_deleted_at_idx" ON "leads" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "lead_comments_lead_id_idx" ON "lead_comments" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_comments_author_id_idx" ON "lead_comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "lead_comments_created_at_idx" ON "lead_comments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "lead_history_lead_id_idx" ON "lead_history" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_history_actor_id_idx" ON "lead_history" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "lead_history_event_type_idx" ON "lead_history" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "lead_history_created_at_idx" ON "lead_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "import_jobs_created_by_idx" ON "import_jobs" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "import_jobs_status_idx" ON "import_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "import_jobs_created_at_idx" ON "import_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "import_rows_job_id_idx" ON "import_rows" USING btree ("import_job_id");--> statement-breakpoint
CREATE INDEX "import_rows_status_idx" ON "import_rows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "import_rows_job_chunk_idx" ON "import_rows" USING btree ("import_job_id","chunk_number");--> statement-breakpoint
CREATE POLICY "admin_read_all_profiles" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin');--> statement-breakpoint
CREATE POLICY "user_read_own_profile" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("profiles"."id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "admin_update_all_profiles" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin') WITH CHECK ((
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin');--> statement-breakpoint
CREATE POLICY "user_update_own_profile" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("profiles"."id" = (select auth.uid())) WITH CHECK ("profiles"."id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "admin_read_all_leads" ON "leads" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin');--> statement-breakpoint
CREATE POLICY "sales_read_assigned_leads" ON "leads" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("leads"."assigned_to" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "admin_insert_leads" ON "leads" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin');--> statement-breakpoint
CREATE POLICY "admin_update_all_leads" ON "leads" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin') WITH CHECK ((
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin');--> statement-breakpoint
CREATE POLICY "sales_update_assigned_leads" ON "leads" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("leads"."assigned_to" = (select auth.uid())) WITH CHECK ("leads"."assigned_to" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "admin_delete_leads" ON "leads" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin');--> statement-breakpoint
CREATE POLICY "admin_read_all_comments" ON "lead_comments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin');--> statement-breakpoint
CREATE POLICY "sales_read_assigned_lead_comments" ON "lead_comments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM leads
        WHERE leads.id = "lead_comments"."lead_id"
        AND leads.assigned_to = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "user_insert_comments" ON "lead_comments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
        "lead_comments"."author_id" = (select auth.uid()) AND (
          (SELECT role FROM profiles WHERE id = (select auth.uid())) = 'admin'
          OR EXISTS (
            SELECT 1 FROM leads
            WHERE leads.id = "lead_comments"."lead_id"
            AND leads.assigned_to = (select auth.uid())
          )
        )
      );--> statement-breakpoint
CREATE POLICY "user_update_own_comments" ON "lead_comments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("lead_comments"."author_id" = (select auth.uid())) WITH CHECK ("lead_comments"."author_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "admin_delete_any_comment" ON "lead_comments" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin');--> statement-breakpoint
CREATE POLICY "user_delete_own_comment" ON "lead_comments" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("lead_comments"."author_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "admin_read_all_history" ON "lead_history" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin');--> statement-breakpoint
CREATE POLICY "sales_read_assigned_lead_history" ON "lead_history" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM leads
        WHERE leads.id = "lead_history"."lead_id"
        AND leads.assigned_to = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "user_insert_history" ON "lead_history" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
        "lead_history"."actor_id" = (select auth.uid()) AND (
          (SELECT role FROM profiles WHERE id = (select auth.uid())) = 'admin'
          OR EXISTS (
            SELECT 1 FROM leads
            WHERE leads.id = "lead_history"."lead_id"
            AND leads.assigned_to = (select auth.uid())
          )
        )
      );--> statement-breakpoint
CREATE POLICY "admin_read_import_jobs" ON "import_jobs" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin');--> statement-breakpoint
CREATE POLICY "admin_insert_import_jobs" ON "import_jobs" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin' AND "import_jobs"."created_by" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "admin_update_import_jobs" ON "import_jobs" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin') WITH CHECK ((
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin');--> statement-breakpoint
CREATE POLICY "admin_read_import_rows" ON "import_rows" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin');--> statement-breakpoint
CREATE POLICY "admin_insert_import_rows" ON "import_rows" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin');--> statement-breakpoint
CREATE POLICY "admin_update_import_rows" ON "import_rows" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin') WITH CHECK ((
        SELECT role FROM profiles WHERE id = (select auth.uid())
      ) = 'admin');