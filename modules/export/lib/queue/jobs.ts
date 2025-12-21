/**
 * Export Job Queue
 *
 * Defines and enqueues export jobs to QStash.
 * Jobs are processed by API route handlers.
 */

import { getQStashClient, getAppUrl } from '@/modules/import/lib/queue/client';
import type { ExportJobPayload } from '../../types';

/**
 * Get headers for Vercel Protection Bypass
 * Required when Vercel Deployment Protection is enabled
 */
function getBypassHeaders(): Record<string, string> {
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (bypassSecret) {
    return {
      'x-vercel-protection-bypass': bypassSecret,
    };
  }
  return {};
}

// ============================================================================
// QUEUE CONFIGURATION
// ============================================================================

const QUEUE_CONFIG = {
  export: {
    path: '/api/export/run',
    retries: 3,
    // Delay between retries: 10s, 30s, 60s
    backoff: 'exponential' as const,
  },
};

// ============================================================================
// ENQUEUE FUNCTION
// ============================================================================

/**
 * Enqueue an export job
 *
 * This job will:
 * 1. Read filters and limits from export_jobs table
 * 2. Query leads in batches (1000 per request)
 * 3. Generate CSV file
 * 4. Upload to Supabase Storage
 * 5. Update job status with download link
 */
export async function enqueueExportJob(
  payload: ExportJobPayload
): Promise<string> {
  const client = getQStashClient();
  const appUrl = getAppUrl();
  const config = QUEUE_CONFIG.export;

  const result = await client.publishJSON({
    url: `${appUrl}${config.path}`,
    body: payload,
    retries: config.retries,
    headers: {
      'X-Export-Job-Id': payload.exportJobId,
      'X-Job-Type': 'export',
      ...getBypassHeaders(),
    },
  });

  console.log(
    `[QStash] Enqueued export job for ${payload.exportJobId}: ${result.messageId}`
  );

  return result.messageId;
}
