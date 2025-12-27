import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client
 *
 * IMPORTANT: Realtime is completely disabled on the browser client.
 * Reason: The app doesn't use client-side realtime subscriptions.
 * - Notifications use polling via server actions
 * - System banners use polling via server actions
 * - Import progress uses server-side SSE (via @/lib/supabase/server)
 *
 * Disabling prevents 401 WebSocket errors from stale sessions when users
 * return after being idle (session expires after 1 hour inactivity).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Completely disable realtime WebSocket connections
      // Not used on browser client - all realtime uses server-side client
      realtime: {
        // Never attempt to reconnect (prevents 401 errors from stale sessions)
        reconnectAfterMs: () => -1,
        // Disable heartbeat to prevent any connection activity
        heartbeatIntervalMs: 0,
      },
    }
  );
}
