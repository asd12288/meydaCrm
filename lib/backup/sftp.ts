import Client from 'ssh2-sftp-client';

const SFTP_CONFIG = {
  host: process.env.BACKUP_SFTP_HOST!,
  port: parseInt(process.env.BACKUP_SFTP_PORT || '22', 10),
  username: process.env.BACKUP_SFTP_USER!,
  password: process.env.BACKUP_SFTP_PASSWORD!,
};

const BACKUP_PATH = process.env.BACKUP_SFTP_PATH || '/var/backups/crm';
const RETENTION_DAYS = 30;

/**
 * Get today's date directory name (YYYY-MM-DD)
 */
function getTodayDir(): string {
  return new Date().toISOString().split('T')[0]; // e.g., "2026-01-01"
}

/**
 * Upload a backup file to the SFTP server
 * Organizes backups in daily directories: /var/backups/crm/2026-01-01/profiles.csv
 */
export async function uploadBackup(
  content: string,
  filename: string
): Promise<{ success: boolean; remotePath: string; error?: string }> {
  const sftp = new Client();
  const dailyDir = `${BACKUP_PATH}/${getTodayDir()}`;
  const remotePath = `${dailyDir}/${filename}`;

  try {
    await sftp.connect(SFTP_CONFIG);

    // Create daily directory if it doesn't exist
    const dirExists = await sftp.exists(dailyDir);
    if (!dirExists) {
      await sftp.mkdir(dailyDir, true);
      console.log(`[Backup] Created directory: ${dailyDir}`);
    }

    // Convert string content to Buffer
    const buffer = Buffer.from(content, 'utf-8');

    // Upload the file
    await sftp.put(buffer, remotePath);

    console.log(`[Backup] Uploaded: ${remotePath}`);

    return { success: true, remotePath };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown SFTP error';
    console.error(`[Backup] SFTP upload failed:`, message);
    return { success: false, remotePath, error: message };
  } finally {
    await sftp.end();
  }
}

/**
 * List all backup directories on the SFTP server
 */
export async function listBackups(): Promise<
  { name: string; size: number; modifyTime: Date }[]
> {
  const sftp = new Client();

  try {
    await sftp.connect(SFTP_CONFIG);

    const items = await sftp.list(BACKUP_PATH);

    // Return directories (daily backup folders) sorted by date descending
    return items
      .filter((f) => f.type === 'd' && /^\d{4}-\d{2}-\d{2}$/.test(f.name))
      .map((f) => ({
        name: f.name,
        size: f.size,
        modifyTime: new Date(f.modifyTime),
      }))
      .sort((a, b) => b.name.localeCompare(a.name)); // Sort by date string descending
  } catch (error) {
    console.error(`[Backup] Failed to list backups:`, error);
    return [];
  } finally {
    await sftp.end();
  }
}

/**
 * Delete old backup directories (older than RETENTION_DAYS)
 * Deletes entire daily directories that are past the retention period
 */
export async function cleanupOldBackups(): Promise<{
  deleted: string[];
  errors: string[];
}> {
  const sftp = new Client();
  const deleted: string[] = [];
  const errors: string[] = [];

  try {
    await sftp.connect(SFTP_CONFIG);

    const items = await sftp.list(BACKUP_PATH);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
    const cutoffStr = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD

    for (const item of items) {
      // Only process daily backup directories (format: YYYY-MM-DD)
      if (item.type !== 'd' || !/^\d{4}-\d{2}-\d{2}$/.test(item.name)) continue;

      // Compare date strings directly (works because YYYY-MM-DD sorts correctly)
      if (item.name < cutoffStr) {
        try {
          const dirPath = `${BACKUP_PATH}/${item.name}`;
          await sftp.rmdir(dirPath, true); // recursive delete
          deleted.push(item.name);
          console.log(`[Backup] Deleted old backup directory: ${item.name}`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          errors.push(`${item.name}: ${msg}`);
        }
      }
    }

    return { deleted, errors };
  } catch (error) {
    console.error(`[Backup] Cleanup failed:`, error);
    return { deleted, errors: [String(error)] };
  } finally {
    await sftp.end();
  }
}

/**
 * Test SFTP connection
 */
export async function testConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  const sftp = new Client();

  try {
    await sftp.connect(SFTP_CONFIG);
    await sftp.list(BACKUP_PATH);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  } finally {
    await sftp.end();
  }
}
