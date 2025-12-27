import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client
 *
 * Note: Realtime is disabled at the Supabase project level.
 * All features use polling via server actions instead.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
