import { Redis } from '@upstash/redis';

// Singleton Redis client for serverless
// Uses REST API - ideal for edge/serverless environments
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache keys enum for type safety
export const CACHE_KEYS = {
  DASHBOARD_ADMIN: 'dashboard:admin',
  DASHBOARD_SALES: (userId: string) => `dashboard:sales:${userId}`,
  SALES_USERS: 'users:sales:list',
  LEADS_STATUS_COUNTS: 'leads:status:counts',
} as const;

// TTL values in seconds
export const CACHE_TTL = {
  DASHBOARD: 60,      // 1 minute - frequently changing
  SALES_USERS: 300,   // 5 minutes - rarely changes
  STATUS_COUNTS: 60,  // 1 minute
} as const;

/**
 * Check if Redis is configured
 * Returns false if env vars are missing (graceful degradation)
 */
function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Get cached data or fetch fresh and cache it
 * Pattern: Cache-aside with automatic refresh
 * 
 * @param key - Cache key
 * @param fetcher - Function to fetch fresh data if cache miss
 * @param ttlSeconds - Time to live in seconds (default: 60)
 * @returns Cached or fresh data
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  // Skip cache if Redis not configured (graceful degradation)
  if (!isRedisConfigured()) {
    return fetcher();
  }

  try {
    // Try cache first
    const cached = await redis.get<T>(key);
    if (cached !== null) {
      return cached;
    }
  } catch (error) {
    // Log but don't fail - fallback to fresh fetch
    console.warn('[Cache] Redis get error:', error);
  }

  // Fetch fresh data
  const fresh = await fetcher();

  try {
    // Cache the result (fire and forget to avoid blocking)
    redis.setex(key, ttlSeconds, fresh).catch((err) => {
      console.warn('[Cache] Redis set error:', err);
    });
  } catch {
    // Ignore cache write errors
  }

  return fresh;
}

/**
 * Invalidate specific cache keys
 * Call this alongside revalidatePath for data mutations
 * 
 * @param keys - Cache keys to invalidate
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  if (!isRedisConfigured() || keys.length === 0) {
    return;
  }

  try {
    await redis.del(...keys);
  } catch (error) {
    console.warn('[Cache] Invalidation error:', error);
  }
}

/**
 * Invalidate all dashboard caches
 * Use after lead mutations that affect stats (status changes, assignments, etc.)
 */
export async function invalidateDashboardCache(): Promise<void> {
  if (!isRedisConfigured()) {
    return;
  }

  try {
    // Get all dashboard keys and delete them
    const keys = await redis.keys('dashboard:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    // Also invalidate status counts
    await redis.del(CACHE_KEYS.LEADS_STATUS_COUNTS);
  } catch (error) {
    console.warn('[Cache] Dashboard invalidation error:', error);
  }
}

/**
 * Invalidate sales users cache
 * Use after user creation, update, or deletion
 */
export async function invalidateSalesUsersCache(): Promise<void> {
  await invalidateCache(CACHE_KEYS.SALES_USERS);
}
