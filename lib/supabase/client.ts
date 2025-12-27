import { createBrowserClient } from '@supabase/ssr';

// NoOp WebSocket class to prevent any realtime connections
class NoOpWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = NoOpWebSocket.CLOSED;
  onopen: ((ev: Event) => unknown) | null = null;
  onclose: ((ev: CloseEvent) => unknown) | null = null;
  onmessage: ((ev: MessageEvent) => unknown) | null = null;
  onerror: ((ev: Event) => unknown) | null = null;

  constructor() {
    // Don't connect to anything
  }
  send() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
}

/**
 * Browser-side Supabase client
 * Realtime is fully disabled using NoOp WebSocket to prevent 401 errors
 * (Realtime is disabled at Supabase project level - we don't use it)
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: {
        transport: NoOpWebSocket as unknown as typeof WebSocket,
      },
    }
  );
}
