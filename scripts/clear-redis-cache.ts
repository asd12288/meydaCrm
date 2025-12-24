/**
 * Script to clear Redis cache
 * Run with: npx tsx scripts/clear-redis-cache.ts [--all | --users | --dashboard]
 *
 * Use this after deployments or when cache becomes stale
 */

import { Redis } from '@upstash/redis';

async function main() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error('❌ Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN');
    console.log('   Set them in your .env.local or pass as environment variables');
    process.exit(1);
  }

  const redis = new Redis({ url, token });
  const arg = process.argv[2] || '--all';

  console.log('🧹 Clearing Redis cache...\n');

  try {
    if (arg === '--users' || arg === '--all') {
      const deleted = await redis.del('users:sales:list');
      console.log(`✅ Cleared users:sales:list (${deleted} key deleted)`);
    }

    if (arg === '--dashboard' || arg === '--all') {
      const dashboardKeys = await redis.keys('dashboard:*');
      if (dashboardKeys.length > 0) {
        await redis.del(...dashboardKeys);
        console.log(`✅ Cleared ${dashboardKeys.length} dashboard keys`);
      } else {
        console.log('ℹ️  No dashboard keys to clear');
      }

      const statusDeleted = await redis.del('leads:status:counts');
      console.log(`✅ Cleared leads:status:counts (${statusDeleted} key deleted)`);
    }

    if (arg === '--all') {
      // Show remaining keys (excluding rate limit keys)
      const remainingKeys = await redis.keys('*');
      const nonRateLimitKeys = remainingKeys.filter(k => !k.includes('ratelimit'));
      if (nonRateLimitKeys.length > 0) {
        console.log(`\nℹ️  Remaining non-ratelimit keys: ${nonRateLimitKeys.join(', ')}`);
      }
    }

    console.log('\n✨ Cache cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    process.exit(1);
  }
}

main();
