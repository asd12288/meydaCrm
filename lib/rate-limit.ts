/**
 * Rate Limiting Utilities
 *
 * Uses Upstash Redis for serverless-compatible rate limiting.
 * Protects against brute force attacks and API abuse.
 *
 * In CI/test environments without Redis, rate limiting is disabled (always allows).
 *
 * @see https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Check if Redis is properly configured
// In CI or when Redis is not available, we'll use a pass-through limiter
const isRedisConfigured =
  process.env.UPSTASH_REDIS_REST_URL?.startsWith('https://') &&
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  process.env.UPSTASH_REDIS_REST_TOKEN !== 'dummy-token-for-ci';

// Create Redis client only if properly configured
const redis = isRedisConfigured ? Redis.fromEnv() : null;

/**
 * Pass-through rate limiter for CI/testing (always allows)
 */
const createPassThroughLimiter = () => ({
  limit: async (_identifier: string) => ({
    success: true,
    remaining: 999,
    reset: Date.now() + 60000,
    limit: 1000,
    pending: Promise.resolve(),
  }),
});

/**
 * Login rate limiter - prevents brute force attacks
 * 5 attempts per minute per IP
 */
export const loginRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      prefix: '@crm/ratelimit:login',
      analytics: true,
    })
  : createPassThroughLimiter();

/**
 * File upload rate limiter - prevents storage abuse
 * 10 uploads per hour per IP
 */
export const uploadRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      prefix: '@crm/ratelimit:upload',
      analytics: true,
    })
  : createPassThroughLimiter();

/**
 * API rate limiter - general protection for API routes
 * 100 requests per minute per IP
 */
export const apiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      prefix: '@crm/ratelimit:api',
      analytics: true,
    })
  : createPassThroughLimiter();

/**
 * Get client identifier from request headers
 * Prioritizes x-forwarded-for (from proxies) over x-real-ip
 */
export function getClientIdentifier(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

/**
 * Check rate limit and return response if exceeded
 *
 * @param limiter - The rate limiter to use
 * @param identifier - Client identifier (usually IP address)
 * @returns Rate limit info if allowed, or a 429 Response if exceeded
 *
 * @example
 * ```ts
 * const result = await checkRateLimit(uploadRateLimiter, getClientIdentifier(request));
 * if (result instanceof Response) {
 *   return result; // Rate limit exceeded
 * }
 * // Continue with normal logic
 * ```
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number } | Response> {
  const { success, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    return new Response(
      JSON.stringify({ error: 'Trop de requêtes. Réessayez plus tard.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return { success, remaining, reset };
}
