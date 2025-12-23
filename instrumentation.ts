/**
 * Next.js Instrumentation File
 *
 * This file captures server-side errors and sends them to PostHog.
 * It runs on the Node.js runtime and catches errors in:
 * - Server Actions
 * - API Routes
 * - Server Components (during rendering)
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */

export function register() {
  // No-op for initialization - PostHog is initialized lazily
}

export async function onRequestError(
  err: Error & { digest?: string },
  request: {
    path: string;
    method: string;
    headers: { [key: string]: string | string[] | undefined };
  },
  context: {
    routerKind: 'Pages Router' | 'App Router';
    routePath: string;
    routeType: 'render' | 'route' | 'action' | 'middleware';
    renderSource?: 'react-server-components' | 'react-server-components-payload' | 'server-rendering';
    revalidateReason?: 'on-demand' | 'stale' | undefined;
    renderType?: 'dynamic' | 'dynamic-resume';
  }
) {
  // Only run in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  try {
    // Dynamically import to avoid issues with Edge runtime
    const { getPostHogServer } = await import('./lib/analytics/posthog-server');
    const posthog = getPostHogServer();

    // Try to get distinct_id from PostHog cookie
    let distinctId: string | undefined;

    if (request.headers.cookie) {
      const cookieString = Array.isArray(request.headers.cookie)
        ? request.headers.cookie.join('; ')
        : request.headers.cookie;

      // Match PostHog cookie pattern
      const postHogCookieMatch = cookieString.match(/ph_phc_.*?_posthog=([^;]+)/);

      if (postHogCookieMatch && postHogCookieMatch[1]) {
        try {
          const decodedCookie = decodeURIComponent(postHogCookieMatch[1]);
          const postHogData = JSON.parse(decodedCookie);
          distinctId = postHogData.distinct_id;
        } catch {
          // Cookie parsing failed, continue without distinct_id
        }
      }
    }

    // Capture the exception
    posthog.captureException(err, distinctId, {
      source: 'server_instrumentation',
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: context.renderSource,
      digest: err.digest,
    });

    // Flush to ensure the event is sent
    await posthog.flush();
  } catch (captureError) {
    // Don't let PostHog errors break the app
    console.error('PostHog capture failed:', captureError);
  }
}
