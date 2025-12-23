'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

interface PostHogIdentifyProps {
  userId: string;
  displayName: string;
  role: string;
}

/**
 * Client component that identifies the user in PostHog.
 * Place this in the protected layout after getting the user profile.
 */
export function PostHogIdentify({ userId, displayName, role }: PostHogIdentifyProps) {
  useEffect(() => {
    if (userId && typeof window !== 'undefined') {
      posthog.identify(userId, {
        name: displayName,
        role: role,
      });
    }
  }, [userId, displayName, role]);

  // Reset on unmount (logout)
  useEffect(() => {
    return () => {
      posthog.reset();
    };
  }, []);

  return null;
}
