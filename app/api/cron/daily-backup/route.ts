import { NextRequest, NextResponse } from 'next/server';
import {
  exportLeadsToCSV,
  generateBackupFilename,
  uploadBackup,
  cleanupOldBackups,
} from '@/lib/backup';

// Vercel Cron sends this header to verify authenticity
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Shared backup logic used by both GET (Vercel Cron) and POST (manual trigger)
 */
async function runBackup(): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    console.log('[Backup] Starting daily backup...');

    // Step 1: Export leads to CSV
    const exportResult = await exportLeadsToCSV();
    if (!exportResult.success || !exportResult.content) {
      console.error('[Backup] Export failed:', exportResult.error);
      return NextResponse.json(
        {
          success: false,
          step: 'export',
          error: exportResult.error,
        },
        { status: 500 }
      );
    }

    console.log(`[Backup] Exported ${exportResult.rowCount} leads`);

    // Step 2: Generate filename and upload to SFTP
    const filename = generateBackupFilename();
    const uploadResult = await uploadBackup(exportResult.content, filename);

    if (!uploadResult.success) {
      console.error('[Backup] Upload failed:', uploadResult.error);
      return NextResponse.json(
        {
          success: false,
          step: 'upload',
          error: uploadResult.error,
        },
        { status: 500 }
      );
    }

    console.log(`[Backup] Uploaded to: ${uploadResult.remotePath}`);

    // Step 3: Cleanup old backups (older than 30 days)
    const cleanupResult = await cleanupOldBackups();
    if (cleanupResult.deleted.length > 0) {
      console.log(`[Backup] Cleaned up ${cleanupResult.deleted.length} old backups`);
    }

    const duration = Date.now() - startTime;
    console.log(`[Backup] Completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      backup: {
        filename,
        remotePath: uploadResult.remotePath,
        rowCount: exportResult.rowCount,
        sizeBytes: exportResult.content.length,
      },
      cleanup: {
        deletedCount: cleanupResult.deleted.length,
        deleted: cleanupResult.deleted,
      },
      durationMs: duration,
    });
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

  // If this is a Vercel Cron request, run the backup
  if (cronHeader === '1') {
    console.log('[Backup] Triggered by Vercel Cron');
    return runBackup();
  }

  // Otherwise, just return status (for manual status checks)
  const authHeader = request.headers.get('authorization');

  if (process.env.NODE_ENV === 'production') {
    const isValidToken =
      CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;

    if (!isValidToken) {
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
