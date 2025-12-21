/**
 * Import Job Queue
 *
 * Defines and enqueues import jobs to QStash.
 * Jobs are processed by API route handlers.
 */

import { getQStashClient, getAppUrl } from './client';
import type { AssignmentConfig, DuplicateConfig } from '../../types';

// ============================================================================
// JOB TYPES
// ============================================================================

export interface ParseJobPayload {
  importJobId: string;
  /** Optional: Resume from this chunk (for retry) */
  startChunk?: number;
}

export interface CommitJobPayload {
  importJobId: string;
  /** Assignment configuration */
  assignment: AssignmentConfig;
  /** Duplicate handling configuration */
  duplicates: DuplicateConfig;
  /** Default status for new leads */
  defaultStatus?: string;
  /** Default source for new leads */
  defaultSource?: string;
}

// ============================================================================
// QUEUE CONFIGURATION
// ============================================================================

const QUEUE_CONFIG = {
  parse: {
    path: '/api/import/parse',
    retries: 3,
    // Delay between retries: 10s, 30s, 60s
    backoff: 'exponential' as const,
  },
  commit: {
    path: '/api/import/commit',
    retries: 3,
    backoff: 'exponential' as const,
  },
};

/**
 * Get headers for Vercel Protection Bypass
 * Required when Vercel Deployment Protection is enabled
 * @see https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
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
// ENQUEUE FUNCTIONS
// ============================================================================

/**
 * Enqueue a parse job
 *
 * This job will:
 * 1. Download the file from Supabase Storage
 * 2. Stream parse the CSV/XLSX file
 * 3. Validate each row
 * 4. Insert validated rows into import_rows table
 * 5. Update progress and handle checkpoints
 */
export async function enqueueParseJob(
  payload: ParseJobPayload
): Promise<string> {
  const client = getQStashClient();
  const appUrl = getAppUrl();
  const config = QUEUE_CONFIG.parse;

  const result = await client.publishJSON({
    url: `${appUrl}${config.path}`,
    body: payload,
    retries: config.retries,
    headers: {
      'X-Import-Job-Id': payload.importJobId,
      'X-Job-Type': 'parse',
      ...getBypassHeaders(),
    },
  });

  console.log(
    `[QStash] Enqueued parse job for ${payload.importJobId}: ${result.messageId}`
  );

  return result.messageId;
}

/**
 * Enqueue a commit job
 *
 * This job will:
 * 1. Read validated rows from import_rows
 * 2. Check for duplicates using indexed queries
 * 3. Apply assignment logic
 * 4. Batch insert into leads table
 * 5. Create lead_history audit events
 * 6. Update import_rows with lead_id
 */
export async function enqueueCommitJob(
  payload: CommitJobPayload
): Promise<string> {
  const client = getQStashClient();
  const appUrl = getAppUrl();
  const config = QUEUE_CONFIG.commit;

  const result = await client.publishJSON({
    url: `${appUrl}${config.path}`,
    body: payload,
    retries: config.retries,
    headers: {
      'X-Import-Job-Id': payload.importJobId,
      'X-Job-Type': 'commit',
      ...getBypassHeaders(),
    },
  });

  console.log(
    `[QStash] Enqueued commit job for ${payload.importJobId}: ${result.messageId}`
  );

  return result.messageId;
}

