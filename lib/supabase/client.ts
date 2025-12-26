import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: {
        params: {
          // Rate limit reconnection attempts to reduce 401 spam from stale sessions
          eventsPerSecond: 1,
        },
      },
    }
  );
}
