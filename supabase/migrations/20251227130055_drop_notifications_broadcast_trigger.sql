-- Drop the notifications broadcast trigger and function
-- Realtime is disabled at the project level, so this trigger is unused
-- and may cause errors when it tries to call realtime.broadcast_changes()

-- Drop the trigger first
DROP TRIGGER IF EXISTS notifications_broadcast_trigger ON public.notifications;

-- Drop the function
DROP FUNCTION IF EXISTS public.notifications_broadcast();
