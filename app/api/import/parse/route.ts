/**
 * Import Parse Worker API Route
 *
 * This API route handles the parsing phase of an import.
 * It delegates to the parse-worker module which handles:
 * 1. Download file from Supabase Storage
 * 2. Stream parse CSV/XLSX row by row
 * 3. Validate each row
 * 4. Insert into import_rows table in batches
 * 5. Update progress with checkpoints
 * 6. Automatically chain to commit worker when parsing completes
 */

import { createQStashHandler, type ParseJobPayload } from '@/modules/import/lib/queue';
import { handleParseDirectly } from '@/modules/import/workers';

// Vercel function configuration
export const maxDuration = 300; // 5 minutes max
export const dynamic = 'force-dynamic';

const LOG_PREFIX = '[API/ImportParse]';

/**
 * POST handler - called by QStash
 * Delegates to the shared parse worker which handles parse → commit chaining
 */
export const POST = createQStashHandler<ParseJobPayload>(async (payload) => {
  console.log(LOG_PREFIX, 'Received parse job', { importJobId: payload.importJobId, startChunk: payload.startChunk });
  const result = await handleParseDirectly(payload.importJobId);
  console.log(LOG_PREFIX, 'Parse job completed', { importJobId: payload.importJobId, success: result.success });
  return result;
});

/**
 * GET handler - for health checks and manual testing
 */
export async function GET() {
  return Response.json({
    status: 'ok',
    worker: 'import-parse',
    maxDuration,
  });
}
