import { createBrowserClient } from '@supabase/ssr';

/**
 * Fake WebSocket that does nothing - prevents realtime connections
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NoOpWebSocket = class {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = 3;
  onopen = null;
  onclose = null;
  onmessage = null;
  onerror = null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_url: string | URL, _protocols?: string | string[]) {}
  close() {}
  send() {}
} as any;

/**
 * Browser-side Supabase client
 * Realtime is disabled - uses NoOp WebSocket to prevent connection attempts
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: {
        transport: NoOpWebSocket,
      },
    }
  );
}
