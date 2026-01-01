import { NextRequest, NextResponse } from 'next/server';
import {
  exportAllTables,
  generateBackupFilename,
  uploadBackup,
  cleanupOldBackups,
} from '@/lib/backup';

// Extend function timeout to 120 seconds (backup takes ~35s, allow buffer)
// Requires Vercel Pro plan for >10s, but setting this prevents silent timeout
export const maxDuration = 120;

// Vercel Cron sends this header to verify authenticity
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Shared backup logic used by both GET (Vercel Cron) and POST (manual trigger)
 */
async function runBackup(): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    console.log('[Backup] Starting daily backup of all tables...');

    // Step 1: Export all tables to CSV
    const exportResults = await exportAllTables();

    const uploadedFiles: {
      table: string;
      filename: string;
      remotePath: string;
      rowCount: number;
      sizeBytes: number;
    }[] = [];
    const failedTables: { table: string; step: string; error: string }[] = [];

    // Step 2: Upload each table's CSV to SFTP
    for (const result of exportResults.results) {
      if (!result.success || !result.content) {
        console.error(`[Backup] Export failed for ${result.table}:`, result.error);
        failedTables.push({
          table: result.table,
          step: 'export',
          error: result.error || 'Unknown export error',
        });
        continue;
      }

      const filename = generateBackupFilename(result.table);
      const uploadResult = await uploadBackup(result.content, filename);

      if (!uploadResult.success) {
        console.error(`[Backup] Upload failed for ${result.table}:`, uploadResult.error);
        failedTables.push({
          table: result.table,
          step: 'upload',
          error: uploadResult.error || 'Unknown upload error',
        });
        continue;
      }

      console.log(`[Backup] Uploaded ${result.table}: ${uploadResult.remotePath}`);
      uploadedFiles.push({
        table: result.table,
        filename,
        remotePath: uploadResult.remotePath,
        rowCount: result.rowCount || 0,
        sizeBytes: result.content.length,
      });
    }

    // Step 3: Cleanup old backups (older than 30 days)
    const cleanupResult = await cleanupOldBackups();
    if (cleanupResult.deleted.length > 0) {
      console.log(`[Backup] Cleaned up ${cleanupResult.deleted.length} old backups`);
    }

    const duration = Date.now() - startTime;
    const allSuccess = failedTables.length === 0;

    console.log(
      `[Backup] Completed in ${duration}ms: ${uploadedFiles.length} tables backed up, ${failedTables.length} failed`
    );

    return NextResponse.json(
      {
        success: allSuccess,
        backups: uploadedFiles,
        failed: failedTables,
        summary: {
          tablesBackedUp: uploadedFiles.length,
          tablesFailed: failedTables.length,
          totalRows: uploadedFiles.reduce((sum, f) => sum + f.rowCount, 0),
          totalBytes: uploadedFiles.reduce((sum, f) => sum + f.sizeBytes, 0),
        },
        cleanup: {
          deletedCount: cleanupResult.deleted.length,
          deleted: cleanupResult.deleted,
        },
        durationMs: duration,
      },
      { status: allSuccess ? 200 : 207 } // 207 = Multi-Status (partial success)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Backup] Unexpected error:', message);

    return NextResponse.json(
      {
        success: false,
        step: 'unknown',
        error: message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for manual triggers
 *
 * Manual trigger (for testing):
 * curl -X POST https://your-app.vercel.app/api/cron/daily-backup \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function POST(request: NextRequest) {
  // Verify the request has valid authorization
  const authHeader = request.headers.get('authorization');
  const cronHeader = request.headers.get('x-vercel-cron');

  // In production, verify either Vercel Cron header or Bearer token
  if (process.env.NODE_ENV === 'production') {
    const isVercelCron = cronHeader === '1';
    const isValidToken =
      CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;

    if (!isVercelCron && !isValidToken) {
      console.error('[Backup] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return runBackup();
}

/**
 * GET endpoint - Vercel Cron uses GET by default
 * This triggers the actual backup when called by Vercel Cron
 */
export async function GET(request: NextRequest) {
  const cronHeader = request.headers.get('x-vercel-cron');
  const authHeader = request.headers.get('authorization');

  // Log all incoming requests for debugging
  console.log('[Backup] GET request received', {
    cronHeader,
    hasAuthHeader: !!authHeader,
    url: request.url,
  });

  // If this is a Vercel Cron request, run the backup
  if (cronHeader === '1') {
    console.log('[Backup] Triggered by Vercel Cron - starting backup');
    return runBackup();
  }

  // Also run backup if authorized via Bearer token (for manual GET triggers)
  if (process.env.NODE_ENV === 'production') {
    const isValidToken = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;

    if (!isValidToken) {
      console.log('[Backup] Unauthorized GET request - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Import dynamically to avoid issues
  const { testConnection, listBackups } = await import('@/lib/backup');

  const connectionTest = await testConnection();
  const backups = connectionTest.success ? await listBackups() : [];

  return NextResponse.json({
    connection: connectionTest,
    recentBackups: backups.slice(0, 10),
    config: {
      host: process.env.BACKUP_SFTP_HOST ? 'configured' : 'missing',
      user: process.env.BACKUP_SFTP_USER ? 'configured' : 'missing',
      password: process.env.BACKUP_SFTP_PASSWORD ? 'configured' : 'missing',
      path: process.env.BACKUP_SFTP_PATH || '/var/backups/crm',
    },
  });
}
