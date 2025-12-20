/**
 * Import Commit Worker API Route
 *
 * This API route handles the commit phase of an import.
 * It delegates to the commit-worker module which handles:
 * 1. Build dedupe set from existing leads
 * 2. Read valid rows from import_rows in batches
 * 3. Check for duplicates
 * 4. Apply assignment logic
 * 5. Batch insert into leads table
 * 6. Create lead_history audit events
 * 7. Update import_rows with lead_id
 * 8. Mark job as completed
 */

import { createQStashHandler, type CommitJobPayload } from '@/modules/import/lib/queue';
import { handleCommitDirectly } from '@/modules/import/workers';

// Vercel function configuration
export const maxDuration = 300; // 5 minutes max
export const dynamic = 'force-dynamic';

/**
 * POST handler - called by QStash
 * Delegates to the shared commit worker which handles status normalization
 */
export const POST = createQStashHandler<CommitJobPayload>(async (payload) => {
  return handleCommitDirectly(
    payload.importJobId,
    payload.assignment,
    payload.duplicates,
    payload.defaultStatus,
    payload.defaultSource
  );
});

/**
 * GET handler - for health checks
 */
export async function GET() {
  return Response.json({
    status: 'ok',
    worker: 'import-commit',
    maxDuration,
  });
}
