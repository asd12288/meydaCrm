import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // CRITICAL: Always use getUser() to validate the session (not getSession)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require auth
  const isPublicRoute = pathname === '/login' || pathname === '/';

  // QStash webhook routes - authenticated via HMAC signature in handler, not cookies
  // SECURITY: These routes bypass session auth because QStash uses cryptographic
  // signatures instead. The createQStashHandler() in each route verifies the
  // Upstash-Signature header using QSTASH_CURRENT_SIGNING_KEY.
  // See: modules/import/lib/queue/verify.ts
  const isQStashWebhook =
    pathname === '/api/import/parse' ||
    pathname === '/api/import/commit' ||
    pathname === '/api/import/error-report' ||
    pathname === '/api/export/run';

  // NOWPayments webhook routes - authenticated via HMAC-SHA512 signature in handler
  // SECURITY: These routes bypass session auth because NOWPayments uses cryptographic
  // signatures (x-nowpayments-sig header) verified against NOWPAYMENTS_IPN_SECRET.
  // The test endpoint is DEV-only (returns 403 in production).
  const isNowPaymentsWebhook =
    pathname === '/api/webhooks/nowpayments' ||
    pathname === '/api/webhooks/nowpayments/test';

  // Allow external webhooks through - signature verification happens in route handler
  if (isQStashWebhook || isNowPaymentsWebhook) {
    return supabaseResponse;
  }

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login page
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Redirect root to dashboard if authenticated
  if (user && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Add pathname header for layout to use
  supabaseResponse.headers.set('x-pathname', pathname);

  return supabaseResponse;
}
