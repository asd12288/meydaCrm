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
 * Upload a backup file to the SFTP server
 */
export async function uploadBackup(
  content: string,
  filename: string
): Promise<{ success: boolean; remotePath: string; error?: string }> {
  const sftp = new Client();
  const remotePath = `${BACKUP_PATH}/${filename}`;

  try {
    await sftp.connect(SFTP_CONFIG);

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
 * List all backup files on the SFTP server
 */
export async function listBackups(): Promise<
  { name: string; size: number; modifyTime: Date }[]
> {
  const sftp = new Client();

  try {
    await sftp.connect(SFTP_CONFIG);

    const files = await sftp.list(BACKUP_PATH);

    return files
      .filter((f) => f.type === '-' && f.name.endsWith('.csv'))
      .map((f) => ({
        name: f.name,
        size: f.size,
        modifyTime: new Date(f.modifyTime),
      }))
      .sort((a, b) => b.modifyTime.getTime() - a.modifyTime.getTime());
  } catch (error) {
    console.error(`[Backup] Failed to list backups:`, error);
    return [];
  } finally {
    await sftp.end();
  }
}

/**
 * Delete old backups (older than RETENTION_DAYS)
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

    const files = await sftp.list(BACKUP_PATH);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    for (const file of files) {
      if (file.type !== '-' || !file.name.endsWith('.csv')) continue;

      const modifyTime = new Date(file.modifyTime);
      if (modifyTime < cutoffDate) {
        try {
          await sftp.delete(`${BACKUP_PATH}/${file.name}`);
          deleted.push(file.name);
          console.log(`[Backup] Deleted old backup: ${file.name}`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          errors.push(`${file.name}: ${msg}`);
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
