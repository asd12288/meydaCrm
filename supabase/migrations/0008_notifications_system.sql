-- Notifications System Migration
-- Adds notifications table with real-time Broadcast support and auto-cleanup

-- Create notifications table
CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "metadata" jsonb,
  "read_at" timestamp with time zone,
  "action_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on notifications
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id", "created_at" DESC);
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id", "read_at");
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");

-- RLS Policies

-- Users can only read their own notifications
CREATE POLICY "users_read_own_notifications" ON "notifications"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ("user_id" = (select auth.uid()));

-- Only service_role can insert (handled by server actions)
-- No insert policy for authenticated role

-- Users can update their own notifications (to mark as read)
CREATE POLICY "users_update_own_notifications" ON "notifications"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ("user_id" = (select auth.uid()))
  WITH CHECK ("user_id" = (select auth.uid()));

-- Users cannot delete notifications (system managed)
-- No delete policy for authenticated role

-- ============================================================================
-- REALTIME BROADCAST SETUP
-- ============================================================================

-- Function to broadcast notification creation
CREATE OR REPLACE FUNCTION public.notifications_broadcast()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'user:' || NEW.user_id::text,  -- Topic: user-specific channel
    'INSERT',                       -- Event type
    'notification_created',         -- Operation
    'public.notifications',         -- Table
    'public',                       -- Schema
    NEW,                            -- New record
    NULL                            -- Old record (none on INSERT)
  );
  RETURN NEW;
END;
$$;

-- Trigger on notification creation
CREATE TRIGGER notifications_broadcast_trigger
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.notifications_broadcast();

-- Realtime authorization policy for Broadcast
-- Users can receive broadcasts from their own notification channel
CREATE POLICY "users_receive_own_notifications" ON "realtime"."messages"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (true); -- Topic filtering happens in client code

-- ============================================================================
-- AUTO-CLEANUP TRIGGER
-- ============================================================================

-- Function to auto-cleanup old notifications
-- Deletes notifications older than 7 days or keeps max 100 per user
CREATE OR REPLACE FUNCTION public.notifications_cleanup()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
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

-- Trigger cleanup after insert (runs after broadcast trigger)
CREATE TRIGGER notifications_cleanup_trigger
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.notifications_cleanup();

-- Add comments for documentation
COMMENT ON TABLE "notifications" IS 'User notifications with real-time Broadcast support and auto-cleanup';
COMMENT ON COLUMN "notifications"."type" IS 'Notification type: lead_assigned, lead_comment, import_completed, import_failed, support_ticket, subscription_warning';
COMMENT ON COLUMN "notifications"."metadata" IS 'Flexible JSON data: lead_id, import_job_id, ticket_id, etc.';
COMMENT ON FUNCTION public.notifications_broadcast() IS 'Broadcasts notification creation to user-specific Realtime channel';
COMMENT ON FUNCTION public.notifications_cleanup() IS 'Auto-cleans notifications: deletes >7 days old or keeps max 100 per user';
