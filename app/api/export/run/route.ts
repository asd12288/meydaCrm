/**
 * Export Worker API Route
 *
 * This API route handles background CSV export jobs.
 * Called by QStash with verified signature.
 *
 * It delegates to the export-worker module which handles:
 * 1. Read job configuration from export_jobs table
 * 2. Query leads in batches with filters
 * 3. Generate CSV file
 * 4. Upload to Supabase Storage
 * 5. Update job status with download path
 */

import { createQStashHandler } from '@/modules/import/lib/queue';
import { handleExportDirectly } from '@/modules/export/workers';
import type { ExportJobPayload } from '@/modules/export/types';

// Vercel function configuration
export const maxDuration = 300; // 5 minutes max
export const dynamic = 'force-dynamic';

/**
 * POST handler - called by QStash
 */
export const POST = createQStashHandler<ExportJobPayload>(async (payload) => {
  return handleExportDirectly(payload.exportJobId);
});

/**
 * GET handler - for health checks
 */
export async function GET() {
  return Response.json({
    status: 'ok',
    worker: 'export',
    maxDuration,
  });
}
