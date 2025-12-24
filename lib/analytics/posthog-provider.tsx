'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';

// Set to true to test locally, false for production
const ENABLE_DEV_TRACKING = false;

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
        // Debug mode shows events in console (only when dev tracking is enabled)
        debug: process.env.NODE_ENV === 'development' && ENABLE_DEV_TRACKING,
        // Enable error tracking
        capture_exceptions: true,
        loaded: (ph) => {
          // Disable in dev unless explicitly enabled for testing
          if (process.env.NODE_ENV === 'development' && !ENABLE_DEV_TRACKING) {
            ph.opt_out_capturing();
          }
        },
      });
    }
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
