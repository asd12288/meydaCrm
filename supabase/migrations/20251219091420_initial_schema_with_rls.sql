


-- =============================================================================
-- Pulse CRM - Initial Schema Migration
-- =============================================================================
-- This migration creates all tables, types, functions, and RLS policies.
-- Dumped from production using: supabase db dump --schema public
-- =============================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Enable required extensions (not included by pg_dump)
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";

CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."banner_target" AS ENUM (
    'all',
    'admin'
);


ALTER TYPE "public"."banner_target" OWNER TO "postgres";


CREATE TYPE "public"."banner_type" AS ENUM (
    'info',
    'warning',
    'success',
    'announcement'
);


ALTER TYPE "public"."banner_type" OWNER TO "postgres";


CREATE TYPE "public"."history_event_type" AS ENUM (
    'created',
    'updated',
    'assigned',
    'status_changed',
    'imported',
    'comment_added',
    'deleted'
);


ALTER TYPE "public"."history_event_type" OWNER TO "postgres";


CREATE TYPE "public"."import_row_status" AS ENUM (
    'pending',
    'valid',
    'invalid',
    'imported',
    'skipped'
);


ALTER TYPE "public"."import_row_status" OWNER TO "postgres";


CREATE TYPE "public"."import_status" AS ENUM (
    'pending',
    'parsing',
    'validating',
    'parsed',
    'ready',
    'importing',
    'completed',
    'failed',
    'queued',
    'cancelled'
);


ALTER TYPE "public"."import_status" OWNER TO "postgres";


CREATE TYPE "public"."lead_status" AS ENUM (
    'new',
    'contacted',
    'qualified',
    'proposal',
    'negotiation',
    'won',
    'lost',
    'no_answer',
    'rdv',
    'no_answer_1',
    'no_answer_2',
    'wrong_number',
    'not_interested',
    'deposit',
    'callback',
    'relance',
    'mail'
);


ALTER TYPE "public"."lead_status" OWNER TO "postgres";


CREATE TYPE "public"."note_color" AS ENUM (
    'yellow',
    'pink',
    'blue',
    'green',
    'purple',
    'orange'
);


ALTER TYPE "public"."note_color" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'waiting',
    'confirming',
    'confirmed',
    'sending',
    'partially_paid',
    'finished',
    'failed',
    'refunded',
    'expired'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."subscription_period" AS ENUM (
    '1_month',
    '3_months',
    '12_months',
    '6_months'
);


ALTER TYPE "public"."subscription_period" OWNER TO "postgres";


CREATE TYPE "public"."subscription_plan" AS ENUM (
    'standard',
    'pro'
);


ALTER TYPE "public"."subscription_plan" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status" AS ENUM (
    'pending',
    'active',
    'grace',
    'expired',
    'cancelled'
);


ALTER TYPE "public"."subscription_status" OWNER TO "postgres";


CREATE TYPE "public"."support_ticket_category" AS ENUM (
    'bug',
    'feature',
    'payment_issue',
    'feedback'
);


ALTER TYPE "public"."support_ticket_category" OWNER TO "postgres";


CREATE TYPE "public"."support_ticket_status" AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'closed'
);


ALTER TYPE "public"."support_ticket_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'sales',
    'developer'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_duplicate_import"("p_file_hash" "text") RETURNS TABLE("job_id" "uuid", "status" "text", "created_at" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT id, status::text, created_at
  FROM import_jobs
  WHERE file_hash = p_file_hash
    AND status IN ('completed', 'importing', 'ready', 'parsing', 'queued')
  ORDER BY created_at DESC
  LIMIT 1;
$$;


ALTER FUNCTION "public"."check_duplicate_import"("p_file_hash" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."import_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "status" "public"."import_status" DEFAULT 'pending'::"public"."import_status" NOT NULL,
    "total_rows" integer,
    "valid_rows" integer,
    "invalid_rows" integer,
    "imported_rows" integer,
    "skipped_rows" integer,
    "current_chunk" integer DEFAULT 0,
    "column_mapping" "jsonb",
    "error_message" "text",
    "error_details" "jsonb",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "total_chunks" integer,
    "file_hash" "text",
    "processed_rows" integer DEFAULT 0,
    "assignment_config" "jsonb",
    "duplicate_config" "jsonb",
    "worker_id" "text",
    "ui_state" "jsonb"
);


ALTER TABLE "public"."import_jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."import_jobs" IS 'Import jobs table - simplified (removed checkpoint and error report features)';



COMMENT ON COLUMN "public"."import_jobs"."ui_state" IS 'Persisted UI state for leave-and-return: {currentStep, mappingConfirmed, optionsConfirmed, lastAccessedAt}';



CREATE OR REPLACE FUNCTION "public"."get_active_imports"() RETURNS SETOF "public"."import_jobs"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT *
  FROM import_jobs
  WHERE created_by = auth.uid()
    AND status IN ('queued', 'pending', 'parsing', 'validating', 'ready', 'importing')
  ORDER BY updated_at DESC;
$$;


ALTER FUNCTION "public"."get_active_imports"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_active_imports"() IS 'Get all active (in-progress) import jobs for the current user. Used for the Active Imports indicator.';



CREATE OR REPLACE FUNCTION "public"."get_leads_stats"() RETURNS json
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT json_build_object(
    'totalLeads', (
      SELECT COUNT(*) 
      FROM leads 
      WHERE deleted_at IS NULL
    ),
    'leadsByStatus', (
      SELECT COALESCE(json_object_agg(status, cnt), '{}'::json)
      FROM (
        SELECT status, COUNT(*) as cnt 
        FROM leads 
        WHERE deleted_at IS NULL 
        GROUP BY status
      ) s
    ),
    'activeSalesCount', (
      SELECT COUNT(DISTINCT assigned_to) 
      FROM leads 
      WHERE assigned_to IS NOT NULL 
      AND deleted_at IS NULL
    ),
    'unassignedCount', (
      SELECT COUNT(*) 
      FROM leads 
      WHERE assigned_to IS NULL 
      AND deleted_at IS NULL
    )
  );
$$;


ALTER FUNCTION "public"."get_leads_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_monthly_leads_trend"() RETURNS TABLE("year" integer, "month" integer, "created" bigint, "assigned" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT 
    EXTRACT(YEAR FROM created_at)::integer as year,
    EXTRACT(MONTH FROM created_at)::integer as month,
    COUNT(*) as created,
    COUNT(assigned_to) as assigned
  FROM leads 
  WHERE deleted_at IS NULL
  GROUP BY 
    EXTRACT(YEAR FROM created_at),
    EXTRACT(MONTH FROM created_at)
  ORDER BY year DESC, month ASC;
$$;


ALTER FUNCTION "public"."get_monthly_leads_trend"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_team_performance"() RETURNS TABLE("user_id" "uuid", "user_name" "text", "total_leads" bigint, "won_leads" bigint)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.assigned_to as user_id,
    p.display_name as user_name,
    COUNT(*)::bigint as total_leads,
    COUNT(*) FILTER (WHERE l.status = 'won')::bigint as won_leads
  FROM leads l
  JOIN profiles p ON l.assigned_to = p.id
  WHERE l.assigned_to IS NOT NULL
    AND l.deleted_at IS NULL
  GROUP BY l.assigned_to, p.display_name
  ORDER BY total_leads DESC;
END;
$$;


ALTER FUNCTION "public"."get_team_performance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ticket_counts_by_status"() RETURNS TABLE("status" "text", "count" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT 
    status::text,
    COUNT(*)::bigint
  FROM support_tickets
  GROUP BY status;
$$;


ALTER FUNCTION "public"."get_ticket_counts_by_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_leads_stats"("target_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Security check: only allow querying own stats, unless admin
  IF target_user_id != auth.uid() AND get_user_role() != 'admin' THEN
    RETURN json_build_object('totalLeads', 0, 'leadsByStatus', '{}'::json);
  END IF;

  RETURN (
    SELECT json_build_object(
      'totalLeads', (
        SELECT COUNT(*)
        FROM leads
        WHERE assigned_to = target_user_id
        AND deleted_at IS NULL
      ),
      'leadsByStatus', (
        SELECT COALESCE(json_object_agg(status, cnt), '{}'::json)
        FROM (
          SELECT status, COUNT(*) as cnt
          FROM leads
          WHERE assigned_to = target_user_id
          AND deleted_at IS NULL
          GROUP BY status
        ) s
      )
    )
  );
END;
$$;


ALTER FUNCTION "public"."get_user_leads_stats"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid()
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_users_with_auth"() RETURNS TABLE("id" "uuid", "role" "text", "display_name" "text", "avatar" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "last_sign_in_at" timestamp with time zone, "email" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT 
    p.id,
    p.role::text,
    p.display_name,
    p.avatar,
    p.created_at,
    p.updated_at,
    au.last_sign_in_at,
    au.email
  FROM public.profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE public.get_user_role() = 'admin'  -- Security: Only admins can see all users
  ORDER BY p.created_at DESC
$$;


ALTER FUNCTION "public"."get_users_with_auth"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'sales'::public.user_role
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    ),
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail user creation
  RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notifications_broadcast"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'user:' || NEW.user_id::text,  -- Topic: user-specific channel
    TG_OP,                          -- Event type (INSERT/UPDATE/DELETE)
    TG_OP,                          -- Operation (same as event)
    TG_TABLE_NAME,                  -- Table name
    TG_TABLE_SCHEMA,                -- Schema
    NEW,                            -- New record
    NULL                            -- Old record (none on INSERT)
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notifications_broadcast"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notifications_broadcast"() IS 'Broadcasts notification creation to user-specific Realtime channel';



CREATE OR REPLACE FUNCTION "public"."notifications_cleanup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  notification_count integer;
  old_threshold timestamp;
BEGIN
  -- Calculate 7 days ago
  old_threshold := now() - interval '7 days';
  
  -- Delete notifications older than 7 days for this user
  DELETE FROM notifications
  WHERE user_id = NEW.user_id
    AND created_at < old_threshold;
  
  -- Count remaining notifications for this user
  SELECT COUNT(*) INTO notification_count
  FROM notifications
  WHERE user_id = NEW.user_id;
  
  -- If more than 100, delete oldest ones (keep newest 100)
  IF notification_count > 100 THEN
    DELETE FROM notifications
    WHERE id IN (
      SELECT id
      FROM notifications
      WHERE user_id = NEW.user_id
      ORDER BY created_at ASC
      LIMIT notification_count - 100
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notifications_cleanup"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notifications_cleanup"() IS 'Auto-cleans notifications: deletes >7 days old or keeps max 100 per user';



CREATE OR REPLACE FUNCTION "public"."update_import_progress"("p_job_id" "uuid", "p_status" "text" DEFAULT NULL::"text", "p_processed_rows" integer DEFAULT NULL::integer, "p_valid_rows" integer DEFAULT NULL::integer, "p_invalid_rows" integer DEFAULT NULL::integer, "p_imported_rows" integer DEFAULT NULL::integer, "p_skipped_rows" integer DEFAULT NULL::integer, "p_current_chunk" integer DEFAULT NULL::integer, "p_total_chunks" integer DEFAULT NULL::integer, "p_last_checkpoint" "jsonb" DEFAULT NULL::"jsonb", "p_error_message" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE import_jobs
  SET
    status = COALESCE(p_status::import_status, status),
    processed_rows = COALESCE(p_processed_rows, processed_rows),
    valid_rows = COALESCE(p_valid_rows, valid_rows),
    invalid_rows = COALESCE(p_invalid_rows, invalid_rows),
    imported_rows = COALESCE(p_imported_rows, imported_rows),
    skipped_rows = COALESCE(p_skipped_rows, skipped_rows),
    current_chunk = COALESCE(p_current_chunk, current_chunk),
    total_chunks = COALESCE(p_total_chunks, total_chunks),
    last_checkpoint = COALESCE(p_last_checkpoint, last_checkpoint),
    error_message = COALESCE(p_error_message, error_message),
    updated_at = NOW(),
    started_at = CASE
      WHEN p_status = 'parsing' AND started_at IS NULL THEN NOW()
      ELSE started_at
    END,
    completed_at = CASE
      WHEN p_status IN ('completed', 'failed', 'cancelled') THEN NOW()
      ELSE completed_at
    END
  WHERE id = p_job_id;
END;
$$;


ALTER FUNCTION "public"."update_import_progress"("p_job_id" "uuid", "p_status" "text", "p_processed_rows" integer, "p_valid_rows" integer, "p_invalid_rows" integer, "p_imported_rows" integer, "p_skipped_rows" integer, "p_current_chunk" integer, "p_total_chunks" integer, "p_last_checkpoint" "jsonb", "p_error_message" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_import_progress"("p_job_id" "uuid", "p_status" "text", "p_processed_rows" integer, "p_valid_rows" integer, "p_invalid_rows" integer, "p_imported_rows" integer, "p_skipped_rows" integer, "p_current_chunk" integer, "p_total_chunks" integer, "p_last_checkpoint" "jsonb", "p_error_message" "text") IS 'Atomic progress update for import workers. Triggers Realtime updates for SSE clients.';



CREATE OR REPLACE FUNCTION "public"."update_support_ticket_comments_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_support_ticket_comments_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_support_tickets_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_support_tickets_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_system_banners_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_system_banners_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."banner_dismissals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "banner_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "dismissed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."banner_dismissals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."export_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "filters" "jsonb",
    "limit_rows" integer,
    "estimated_rows" integer,
    "processed_rows" integer DEFAULT 0,
    "total_rows" integer,
    "file_path" "text",
    "file_size_bytes" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "error_message" "text",
    CONSTRAINT "export_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."export_jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."export_jobs" IS 'Tracks background CSV export jobs with QStash processing';



CREATE TABLE IF NOT EXISTS "public"."import_rows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "import_job_id" "uuid" NOT NULL,
    "row_number" integer NOT NULL,
    "chunk_number" integer NOT NULL,
    "status" "public"."import_row_status" DEFAULT 'pending'::"public"."import_row_status" NOT NULL,
    "raw_data" "jsonb" NOT NULL,
    "normalized_data" "jsonb",
    "validation_errors" "jsonb",
    "lead_id" "uuid",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."import_rows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."lead_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "actor_id" "uuid",
    "event_type" "public"."history_event_type" NOT NULL,
    "before_data" "jsonb",
    "after_data" "jsonb",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."lead_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "external_id" "text",
    "first_name" "text",
    "last_name" "text",
    "email" character varying(255),
    "phone" character varying(50),
    "company" "text",
    "job_title" "text",
    "address" "text",
    "city" "text",
    "postal_code" character varying(20),
    "country" "text" DEFAULT 'France'::"text",
    "status" "public"."lead_status" DEFAULT 'relance'::"public"."lead_status" NOT NULL,
    "status_label" "text" DEFAULT 'Relance'::"text" NOT NULL,
    "source" "text",
    "notes" "text",
    "assigned_to" "uuid",
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "import_job_id" "uuid"
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text",
    "content" "text" NOT NULL,
    "color" "public"."note_color" DEFAULT 'yellow'::"public"."note_color" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "lead_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "position_x" integer DEFAULT 100 NOT NULL,
    "position_y" integer DEFAULT 100 NOT NULL,
    "width" integer DEFAULT 240 NOT NULL,
    "height" integer DEFAULT 200 NOT NULL,
    "z_index" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "metadata" "jsonb",
    "read_at" timestamp with time zone,
    "action_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'User notifications with real-time Broadcast support and auto-cleanup';



COMMENT ON COLUMN "public"."notifications"."type" IS 'Notification type: lead_assigned, lead_comment, import_completed, import_failed, support_ticket, subscription_warning';



COMMENT ON COLUMN "public"."notifications"."metadata" IS 'Flexible JSON data: lead_id, import_job_id, ticket_id, etc.';



CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "plan" "public"."subscription_plan" NOT NULL,
    "period" "public"."subscription_period" NOT NULL,
    "amount_usd" numeric(10,2) NOT NULL,
    "nowpayments_payment_id" "text",
    "nowpayments_order_id" "text",
    "payment_url" "text",
    "status" "public"."payment_status" DEFAULT 'waiting'::"public"."payment_status" NOT NULL,
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


COMMENT ON TABLE "public"."payments" IS 'Payment history for subscriptions. Admin-only access.';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "public"."user_role" DEFAULT 'sales'::"public"."user_role" NOT NULL,
    "display_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "avatar" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."avatar" IS 'Avatar image identifier (e.g., avatar-01). NULL means use initials fallback.';



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan" "public"."subscription_plan" NOT NULL,
    "period" "public"."subscription_period" NOT NULL,
    "status" "public"."subscription_status" DEFAULT 'pending'::"public"."subscription_status" NOT NULL,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."subscriptions" IS 'Global CRM subscription - single row expected. Admin-only access.';



CREATE TABLE IF NOT EXISTS "public"."support_ticket_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "is_internal" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."support_ticket_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "category" "public"."support_ticket_category" NOT NULL,
    "subject" "text" NOT NULL,
    "description" "text" NOT NULL,
    "status" "public"."support_ticket_status" DEFAULT 'open'::"public"."support_ticket_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_banners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message" "text" NOT NULL,
    "type" "public"."banner_type" DEFAULT 'info'::"public"."banner_type" NOT NULL,
    "target_audience" "public"."banner_target" DEFAULT 'all'::"public"."banner_target" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "is_dismissible" boolean DEFAULT true NOT NULL,
    "expires_at" timestamp with time zone,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."system_banners" OWNER TO "postgres";


ALTER TABLE ONLY "public"."banner_dismissals"
    ADD CONSTRAINT "banner_dismissals_banner_id_user_id_key" UNIQUE ("banner_id", "user_id");



ALTER TABLE ONLY "public"."banner_dismissals"
    ADD CONSTRAINT "banner_dismissals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."export_jobs"
    ADD CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."import_jobs"
    ADD CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."import_rows"
    ADD CONSTRAINT "import_rows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_comments"
    ADD CONSTRAINT "lead_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_history"
    ADD CONSTRAINT "lead_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_nowpayments_payment_id_key" UNIQUE ("nowpayments_payment_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_ticket_comments"
    ADD CONSTRAINT "support_ticket_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_banners"
    ADD CONSTRAINT "system_banners_pkey" PRIMARY KEY ("id");



CREATE INDEX "banner_dismissals_banner_id_idx" ON "public"."banner_dismissals" USING "btree" ("banner_id");



CREATE INDEX "banner_dismissals_user_id_idx" ON "public"."banner_dismissals" USING "btree" ("user_id");



CREATE INDEX "idx_export_jobs_expires" ON "public"."export_jobs" USING "btree" ("expires_at") WHERE ("status" = 'completed'::"text");



CREATE INDEX "idx_export_jobs_user" ON "public"."export_jobs" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "import_jobs_active_idx" ON "public"."import_jobs" USING "btree" ("created_by", "status", "updated_at" DESC) WHERE ("status" = ANY (ARRAY['queued'::"public"."import_status", 'pending'::"public"."import_status", 'parsing'::"public"."import_status", 'validating'::"public"."import_status", 'ready'::"public"."import_status", 'importing'::"public"."import_status"]));



CREATE INDEX "import_jobs_created_at_idx" ON "public"."import_jobs" USING "btree" ("created_at");



CREATE INDEX "import_jobs_created_by_idx" ON "public"."import_jobs" USING "btree" ("created_by");



CREATE INDEX "import_jobs_file_hash_idx" ON "public"."import_jobs" USING "btree" ("file_hash") WHERE ("file_hash" IS NOT NULL);



CREATE INDEX "import_jobs_id_status_idx" ON "public"."import_jobs" USING "btree" ("id", "status");



CREATE INDEX "import_jobs_status_idx" ON "public"."import_jobs" USING "btree" ("status");



CREATE INDEX "import_jobs_worker_id_idx" ON "public"."import_jobs" USING "btree" ("worker_id") WHERE ("worker_id" IS NOT NULL);



CREATE INDEX "import_rows_job_chunk_idx" ON "public"."import_rows" USING "btree" ("import_job_id", "chunk_number");



CREATE INDEX "import_rows_job_id_idx" ON "public"."import_rows" USING "btree" ("import_job_id");



CREATE INDEX "import_rows_job_valid_idx" ON "public"."import_rows" USING "btree" ("import_job_id") WHERE ("status" = 'valid'::"public"."import_row_status");



CREATE INDEX "import_rows_status_idx" ON "public"."import_rows" USING "btree" ("status");



CREATE INDEX "lead_comments_author_id_idx" ON "public"."lead_comments" USING "btree" ("author_id");



CREATE INDEX "lead_comments_created_at_idx" ON "public"."lead_comments" USING "btree" ("created_at");



CREATE INDEX "lead_comments_lead_id_idx" ON "public"."lead_comments" USING "btree" ("lead_id");



CREATE INDEX "lead_history_actor_id_idx" ON "public"."lead_history" USING "btree" ("actor_id");



CREATE INDEX "lead_history_created_at_idx" ON "public"."lead_history" USING "btree" ("created_at");



CREATE INDEX "lead_history_event_type_idx" ON "public"."lead_history" USING "btree" ("event_type");



CREATE INDEX "lead_history_lead_id_idx" ON "public"."lead_history" USING "btree" ("lead_id");



CREATE INDEX "leads_active_status_updated_idx" ON "public"."leads" USING "btree" ("status", "updated_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "leads_active_updated_idx" ON "public"."leads" USING "btree" ("updated_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "leads_assigned_status_idx" ON "public"."leads" USING "btree" ("assigned_to", "status");



CREATE INDEX "leads_assigned_updated_idx" ON "public"."leads" USING "btree" ("assigned_to", "updated_at");



CREATE INDEX "leads_company_trgm_idx" ON "public"."leads" USING "gin" ("company" "public"."gin_trgm_ops") WHERE ("deleted_at" IS NULL);



CREATE INDEX "leads_deleted_at_idx" ON "public"."leads" USING "btree" ("deleted_at");



CREATE INDEX "leads_email_idx" ON "public"."leads" USING "btree" ("email") WHERE (("email" IS NOT NULL) AND ("deleted_at" IS NULL));



CREATE INDEX "leads_email_lower_idx" ON "public"."leads" USING "btree" ("lower"(("email")::"text")) WHERE (("email" IS NOT NULL) AND ("deleted_at" IS NULL));



CREATE INDEX "leads_email_trgm_idx" ON "public"."leads" USING "gin" ("email" "public"."gin_trgm_ops") WHERE ("deleted_at" IS NULL);



CREATE INDEX "leads_external_id_idx" ON "public"."leads" USING "btree" ("external_id");



CREATE INDEX "leads_first_name_trgm_idx" ON "public"."leads" USING "gin" ("first_name" "public"."gin_trgm_ops") WHERE ("deleted_at" IS NULL);



CREATE INDEX "leads_last_name_trgm_idx" ON "public"."leads" USING "gin" ("last_name" "public"."gin_trgm_ops") WHERE ("deleted_at" IS NULL);



CREATE INDEX "leads_phone_idx" ON "public"."leads" USING "btree" ("phone") WHERE (("phone" IS NOT NULL) AND ("deleted_at" IS NULL));



CREATE INDEX "leads_phone_trgm_idx" ON "public"."leads" USING "gin" ("phone" "public"."gin_trgm_ops") WHERE ("deleted_at" IS NULL);



CREATE INDEX "leads_search_trgm_idx" ON "public"."leads" USING "gin" ((((((COALESCE("first_name", ''::"text") || ' '::"text") || COALESCE("last_name", ''::"text")) || ' '::"text") || COALESCE("company", ''::"text"))) "public"."gin_trgm_ops") WHERE ("deleted_at" IS NULL);



CREATE INDEX "notes_created_by_position_idx" ON "public"."notes" USING "btree" ("created_by", "position");



CREATE INDEX "notes_created_by_z_index_idx" ON "public"."notes" USING "btree" ("created_by", "z_index" DESC);



CREATE INDEX "notes_lead_id_idx" ON "public"."notes" USING "btree" ("lead_id") WHERE ("lead_id" IS NOT NULL);



CREATE INDEX "notifications_created_at_idx" ON "public"."notifications" USING "btree" ("created_at");



CREATE INDEX "notifications_user_created_idx" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "notifications_user_read_idx" ON "public"."notifications" USING "btree" ("user_id", "read_at");



CREATE INDEX "payments_nowpayments_payment_id_idx" ON "public"."payments" USING "btree" ("nowpayments_payment_id");



CREATE INDEX "payments_status_idx" ON "public"."payments" USING "btree" ("status");



CREATE INDEX "payments_subscription_id_idx" ON "public"."payments" USING "btree" ("subscription_id");



CREATE INDEX "profiles_role_idx" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "support_ticket_comments_created_at_idx" ON "public"."support_ticket_comments" USING "btree" ("created_at");



CREATE INDEX "support_ticket_comments_ticket_id_idx" ON "public"."support_ticket_comments" USING "btree" ("ticket_id");



CREATE INDEX "support_tickets_category_idx" ON "public"."support_tickets" USING "btree" ("category");



CREATE INDEX "support_tickets_created_at_idx" ON "public"."support_tickets" USING "btree" ("created_at");



CREATE INDEX "support_tickets_created_by_idx" ON "public"."support_tickets" USING "btree" ("created_by");



CREATE INDEX "support_tickets_status_idx" ON "public"."support_tickets" USING "btree" ("status");



CREATE INDEX "system_banners_created_at_idx" ON "public"."system_banners" USING "btree" ("created_at");



CREATE INDEX "system_banners_expires_at_idx" ON "public"."system_banners" USING "btree" ("expires_at");



CREATE INDEX "system_banners_is_active_idx" ON "public"."system_banners" USING "btree" ("is_active");



CREATE INDEX "system_banners_target_audience_idx" ON "public"."system_banners" USING "btree" ("target_audience");



CREATE OR REPLACE TRIGGER "notifications_broadcast_trigger" AFTER INSERT ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."notifications_broadcast"();



CREATE OR REPLACE TRIGGER "notifications_cleanup_trigger" AFTER INSERT ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."notifications_cleanup"();



CREATE OR REPLACE TRIGGER "support_ticket_comments_updated_at" BEFORE UPDATE ON "public"."support_ticket_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_support_ticket_comments_updated_at"();



CREATE OR REPLACE TRIGGER "support_tickets_updated_at" BEFORE UPDATE ON "public"."support_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."update_support_tickets_updated_at"();



CREATE OR REPLACE TRIGGER "system_banners_updated_at" BEFORE UPDATE ON "public"."system_banners" FOR EACH ROW EXECUTE FUNCTION "public"."update_system_banners_updated_at"();



ALTER TABLE ONLY "public"."banner_dismissals"
    ADD CONSTRAINT "banner_dismissals_banner_id_fkey" FOREIGN KEY ("banner_id") REFERENCES "public"."system_banners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."banner_dismissals"
    ADD CONSTRAINT "banner_dismissals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."export_jobs"
    ADD CONSTRAINT "export_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."import_jobs"
    ADD CONSTRAINT "import_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."import_rows"
    ADD CONSTRAINT "import_rows_import_job_id_import_jobs_id_fk" FOREIGN KEY ("import_job_id") REFERENCES "public"."import_jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_comments"
    ADD CONSTRAINT "lead_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lead_comments"
    ADD CONSTRAINT "lead_comments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_history"
    ADD CONSTRAINT "lead_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lead_history"
    ADD CONSTRAINT "lead_history_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_ticket_comments"
    ADD CONSTRAINT "support_ticket_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_ticket_comments"
    ADD CONSTRAINT "support_ticket_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."system_banners"
    ADD CONSTRAINT "system_banners_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



CREATE POLICY "admin_all_exports" ON "public"."export_jobs" TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_delete_any_comment" ON "public"."lead_comments" FOR DELETE TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_delete_import_jobs" ON "public"."import_jobs" FOR DELETE TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_delete_import_rows" ON "public"."import_rows" FOR DELETE TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_delete_payments" ON "public"."payments" FOR DELETE TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_delete_subscriptions" ON "public"."subscriptions" FOR DELETE TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_delete_ticket_comments" ON "public"."support_ticket_comments" FOR DELETE TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_delete_tickets" ON "public"."support_tickets" FOR DELETE TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_insert_import_jobs" ON "public"."import_jobs" FOR INSERT TO "authenticated" WITH CHECK ((("public"."get_user_role"() = 'admin'::"text") AND ("created_by" = "auth"."uid"())));



CREATE POLICY "admin_insert_import_rows" ON "public"."import_rows" FOR INSERT TO "authenticated" WITH CHECK (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_insert_payments" ON "public"."payments" FOR INSERT TO "authenticated" WITH CHECK (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_insert_subscriptions" ON "public"."subscriptions" FOR INSERT TO "authenticated" WITH CHECK (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_insert_ticket_comments" ON "public"."support_ticket_comments" FOR INSERT TO "authenticated" WITH CHECK ((("public"."get_user_role"() = 'admin'::"text") AND ("author_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "admin_insert_tickets" ON "public"."support_tickets" FOR INSERT TO "authenticated" WITH CHECK ((("public"."get_user_role"() = 'admin'::"text") AND ("created_by" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "admin_read_admin_target_banners" ON "public"."system_banners" FOR SELECT TO "authenticated" USING ((("is_active" = true) AND ("target_audience" = 'admin'::"public"."banner_target") AND ("public"."get_user_role"() = 'admin'::"text") AND (("expires_at" IS NULL) OR ("expires_at" > "now"()))));



CREATE POLICY "admin_read_all_comments" ON "public"."lead_comments" FOR SELECT TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_read_all_history" ON "public"."lead_history" FOR SELECT TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_read_all_tickets" ON "public"."support_tickets" FOR SELECT TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_read_import_jobs" ON "public"."import_jobs" FOR SELECT TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_read_import_rows" ON "public"."import_rows" FOR SELECT TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_read_payments" ON "public"."payments" FOR SELECT TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_read_subscriptions" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_read_ticket_comments" ON "public"."support_ticket_comments" FOR SELECT TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_update_all_profiles" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text")) WITH CHECK (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_update_import_jobs" ON "public"."import_jobs" FOR UPDATE TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text")) WITH CHECK (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_update_import_rows" ON "public"."import_rows" FOR UPDATE TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text")) WITH CHECK (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_update_own_comments" ON "public"."support_ticket_comments" FOR UPDATE TO "authenticated" USING ((("public"."get_user_role"() = 'admin'::"text") AND ("author_id" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK ((("public"."get_user_role"() = 'admin'::"text") AND ("author_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "admin_update_payments" ON "public"."payments" FOR UPDATE TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text")) WITH CHECK (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_update_subscriptions" ON "public"."subscriptions" FOR UPDATE TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text")) WITH CHECK (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "admin_update_tickets" ON "public"."support_tickets" FOR UPDATE TO "authenticated" USING (("public"."get_user_role"() = 'admin'::"text")) WITH CHECK (("public"."get_user_role"() = 'admin'::"text"));



CREATE POLICY "all_users_read_profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."banner_dismissals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "developer_delete_banners" ON "public"."system_banners" FOR DELETE TO "authenticated" USING (("public"."get_user_role"() = 'developer'::"text"));



CREATE POLICY "developer_insert_banners" ON "public"."system_banners" FOR INSERT TO "authenticated" WITH CHECK ((("public"."get_user_role"() = 'developer'::"text") AND ("created_by" = "auth"."uid"())));



CREATE POLICY "developer_insert_ticket_comments" ON "public"."support_ticket_comments" FOR INSERT TO "authenticated" WITH CHECK ((("public"."get_user_role"() = 'developer'::"text") AND ("author_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "developer_read_all_banners" ON "public"."system_banners" FOR SELECT TO "authenticated" USING (("public"."get_user_role"() = 'developer'::"text"));



CREATE POLICY "developer_read_all_dismissals" ON "public"."banner_dismissals" FOR SELECT TO "authenticated" USING (("public"."get_user_role"() = 'developer'::"text"));



CREATE POLICY "developer_read_all_tickets" ON "public"."support_tickets" FOR SELECT TO "authenticated" USING (("public"."get_user_role"() = 'developer'::"text"));



CREATE POLICY "developer_read_ticket_comments" ON "public"."support_ticket_comments" FOR SELECT TO "authenticated" USING (("public"."get_user_role"() = 'developer'::"text"));



CREATE POLICY "developer_update_banners" ON "public"."system_banners" FOR UPDATE TO "authenticated" USING (("public"."get_user_role"() = 'developer'::"text")) WITH CHECK (("public"."get_user_role"() = 'developer'::"text"));



CREATE POLICY "developer_update_own_comments" ON "public"."support_ticket_comments" FOR UPDATE TO "authenticated" USING ((("public"."get_user_role"() = 'developer'::"text") AND ("author_id" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK ((("public"."get_user_role"() = 'developer'::"text") AND ("author_id" = ( SELECT "auth"."uid"() AS "uid"))));



ALTER TABLE "public"."export_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."import_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."import_rows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "leads_delete_policy" ON "public"."leads" FOR DELETE TO "authenticated" USING ((( SELECT "public"."get_user_role"() AS "get_user_role") = 'admin'::"text"));



CREATE POLICY "leads_insert_policy" ON "public"."leads" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "public"."get_user_role"() AS "get_user_role") = 'admin'::"text"));



CREATE POLICY "leads_select_policy" ON "public"."leads" FOR SELECT TO "authenticated" USING (((( SELECT "public"."get_user_role"() AS "get_user_role") = 'admin'::"text") OR ("assigned_to" = "auth"."uid"())));



CREATE POLICY "leads_update_policy" ON "public"."leads" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."get_user_role"() AS "get_user_role") = 'admin'::"text") OR ("assigned_to" = "auth"."uid"()))) WITH CHECK (((( SELECT "public"."get_user_role"() AS "get_user_role") = 'admin'::"text") OR ("assigned_to" = "auth"."uid"())));



ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sales_read_assigned_lead_comments" ON "public"."lead_comments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."leads"
  WHERE (("leads"."id" = "lead_comments"."lead_id") AND ("leads"."assigned_to" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "sales_read_assigned_lead_history" ON "public"."lead_history" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."leads"
  WHERE (("leads"."id" = "lead_history"."lead_id") AND ("leads"."assigned_to" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_ticket_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_banners" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_delete_own_comment" ON "public"."lead_comments" FOR DELETE TO "authenticated" USING (("author_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "user_insert_comments" ON "public"."lead_comments" FOR INSERT TO "authenticated" WITH CHECK ((("author_id" = "auth"."uid"()) AND (("public"."get_user_role"() = 'admin'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."leads"
  WHERE (("leads"."id" = "lead_comments"."lead_id") AND ("leads"."assigned_to" = "auth"."uid"())))))));



CREATE POLICY "user_insert_history" ON "public"."lead_history" FOR INSERT TO "authenticated" WITH CHECK ((("actor_id" = "auth"."uid"()) AND (("public"."get_user_role"() = 'admin'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."leads"
  WHERE (("leads"."id" = "lead_history"."lead_id") AND ("leads"."assigned_to" = "auth"."uid"())))))));



CREATE POLICY "user_update_own_comments" ON "public"."lead_comments" FOR UPDATE TO "authenticated" USING (("author_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("author_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "user_update_own_profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "users_delete_own_notes" ON "public"."notes" FOR DELETE TO "authenticated" USING (("created_by" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "users_insert_own_dismissals" ON "public"."banner_dismissals" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_insert_own_notes" ON "public"."notes" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "users_own_exports" ON "public"."export_jobs" TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "users_read_all_target_banners" ON "public"."system_banners" FOR SELECT TO "authenticated" USING ((("is_active" = true) AND ("target_audience" = 'all'::"public"."banner_target") AND (("expires_at" IS NULL) OR ("expires_at" > "now"()))));



CREATE POLICY "users_read_own_dismissals" ON "public"."banner_dismissals" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "users_read_own_notes" ON "public"."notes" FOR SELECT TO "authenticated" USING (("created_by" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "users_read_own_notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "users_update_own_notes" ON "public"."notes" FOR UPDATE TO "authenticated" USING (("created_by" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("created_by" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "users_update_own_notifications" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."check_duplicate_import"("p_file_hash" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_duplicate_import"("p_file_hash" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_duplicate_import"("p_file_hash" "text") TO "service_role";



GRANT ALL ON TABLE "public"."import_jobs" TO "anon";
GRANT ALL ON TABLE "public"."import_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."import_jobs" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_imports"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_imports"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_imports"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_leads_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_leads_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_leads_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_monthly_leads_trend"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_monthly_leads_trend"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_monthly_leads_trend"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_team_performance"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_team_performance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_team_performance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ticket_counts_by_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_ticket_counts_by_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ticket_counts_by_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_leads_stats"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_leads_stats"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_leads_stats"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_users_with_auth"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_users_with_auth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_users_with_auth"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notifications_broadcast"() TO "anon";
GRANT ALL ON FUNCTION "public"."notifications_broadcast"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notifications_broadcast"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notifications_cleanup"() TO "anon";
GRANT ALL ON FUNCTION "public"."notifications_cleanup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notifications_cleanup"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_import_progress"("p_job_id" "uuid", "p_status" "text", "p_processed_rows" integer, "p_valid_rows" integer, "p_invalid_rows" integer, "p_imported_rows" integer, "p_skipped_rows" integer, "p_current_chunk" integer, "p_total_chunks" integer, "p_last_checkpoint" "jsonb", "p_error_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_import_progress"("p_job_id" "uuid", "p_status" "text", "p_processed_rows" integer, "p_valid_rows" integer, "p_invalid_rows" integer, "p_imported_rows" integer, "p_skipped_rows" integer, "p_current_chunk" integer, "p_total_chunks" integer, "p_last_checkpoint" "jsonb", "p_error_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_import_progress"("p_job_id" "uuid", "p_status" "text", "p_processed_rows" integer, "p_valid_rows" integer, "p_invalid_rows" integer, "p_imported_rows" integer, "p_skipped_rows" integer, "p_current_chunk" integer, "p_total_chunks" integer, "p_last_checkpoint" "jsonb", "p_error_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_support_ticket_comments_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_support_ticket_comments_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_support_ticket_comments_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_support_tickets_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_support_tickets_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_support_tickets_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_system_banners_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_system_banners_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_system_banners_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."banner_dismissals" TO "anon";
GRANT ALL ON TABLE "public"."banner_dismissals" TO "authenticated";
GRANT ALL ON TABLE "public"."banner_dismissals" TO "service_role";



GRANT ALL ON TABLE "public"."export_jobs" TO "anon";
GRANT ALL ON TABLE "public"."export_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."export_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."import_rows" TO "anon";
GRANT ALL ON TABLE "public"."import_rows" TO "authenticated";
GRANT ALL ON TABLE "public"."import_rows" TO "service_role";



GRANT ALL ON TABLE "public"."lead_comments" TO "anon";
GRANT ALL ON TABLE "public"."lead_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_comments" TO "service_role";



GRANT ALL ON TABLE "public"."lead_history" TO "anon";
GRANT ALL ON TABLE "public"."lead_history" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_history" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."notes" TO "anon";
GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."support_ticket_comments" TO "anon";
GRANT ALL ON TABLE "public"."support_ticket_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."support_ticket_comments" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."system_banners" TO "anon";
GRANT ALL ON TABLE "public"."system_banners" TO "authenticated";
GRANT ALL ON TABLE "public"."system_banners" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







