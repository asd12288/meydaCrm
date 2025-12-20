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

export interface ErrorReportJobPayload {
  importJobId: string;
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
  errorReport: {
    path: '/api/import/error-report',
    retries: 2,
    backoff: 'fixed' as const,
  },
};

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
    },
  });

  console.log(
    `[QStash] Enqueued commit job for ${payload.importJobId}: ${result.messageId}`
  );

  return result.messageId;
}

/**
 * Enqueue an error report generation job
 *
 * This job will:
 * 1. Read invalid rows from import_rows
 * 2. Generate a CSV with errors
 * 3. Upload to Supabase Storage
 * 4. Update import_job with report path
 */
export async function enqueueErrorReportJob(
  payload: ErrorReportJobPayload
): Promise<string> {
  const client = getQStashClient();
  const appUrl = getAppUrl();
  const config = QUEUE_CONFIG.errorReport;

  const result = await client.publishJSON({
    url: `${appUrl}${config.path}`,
    body: payload,
    retries: config.retries,
    headers: {
      'X-Import-Job-Id': payload.importJobId,
      'X-Job-Type': 'error-report',
    },
  });

  console.log(
    `[QStash] Enqueued error report job for ${payload.importJobId}: ${result.messageId}`
  );

  return result.messageId;
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Enqueue multiple parse jobs for chunked processing
 * Used for very large files (>50k rows)
 *
 * @param importJobId - The import job ID
 * @param totalChunks - Total number of chunks to process
 * @param startChunk - Starting chunk number (default 0)
 */
export async function enqueueParseJobsInBatches(
  importJobId: string,
  totalChunks: number,
  startChunk: number = 0
): Promise<string[]> {
  const client = getQStashClient();
  const appUrl = getAppUrl();
  const config = QUEUE_CONFIG.parse;

  const messageIds: string[] = [];

  // Enqueue chunks in parallel (up to 10 at a time)
  const BATCH_SIZE = 10;

  for (let i = startChunk; i < totalChunks; i += BATCH_SIZE) {
    const batch = [];

    for (let j = i; j < Math.min(i + BATCH_SIZE, totalChunks); j++) {
      batch.push(
        client.publishJSON({
          url: `${appUrl}${config.path}`,
          body: { importJobId, startChunk: j } as ParseJobPayload,
          retries: config.retries,
          headers: {
            'X-Import-Job-Id': importJobId,
            'X-Job-Type': 'parse',
            'X-Chunk-Number': j.toString(),
          },
        })
      );
    }

    const results = await Promise.all(batch);
    messageIds.push(...results.map((r) => r.messageId));
  }

  console.log(
    `[QStash] Enqueued ${messageIds.length} parse jobs for ${importJobId}`
  );

  return messageIds;
}
