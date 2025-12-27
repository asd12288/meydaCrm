import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client
 * Note: Realtime is disabled at Supabase project level
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
