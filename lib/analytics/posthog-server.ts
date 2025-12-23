import { PostHog } from 'posthog-node';

let posthogServerInstance: PostHog | null = null;

/**
 * Get the PostHog server-side client (singleton).
 * Used for capturing events and errors from Server Actions, API routes, etc.
 *
 * Note: flushAt=1 and flushInterval=0 because Next.js server functions are short-lived
 */
export function getPostHogServer(): PostHog {
  if (!posthogServerInstance) {
    posthogServerInstance = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_KEY!,
      {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
        // Flush immediately since server functions are short-lived
        flushAt: 1,
        flushInterval: 0,
      }
    );
  }

  return posthogServerInstance;
}

/**
 * Capture a server-side exception with context.
 */
export async function captureServerException(
  error: Error,
  distinctId?: string,
  additionalProperties?: Record<string, unknown>
) {
  const posthog = getPostHogServer();

  posthog.captureException(error, distinctId, {
    source: 'server',
    ...additionalProperties,
  });

  // Ensure the event is sent before the function ends
  await posthog.flush();
}
