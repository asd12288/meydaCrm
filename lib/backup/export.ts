import { createClient } from '@supabase/supabase-js';

/**
 * Get Supabase client with service role (for server-side backup operations)
 * Created lazily to avoid build-time environment variable access
 */
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Tables to backup with their configuration
 */
export const BACKUP_TABLES = [
  { name: 'profiles', orderBy: 'created_at' },
  { name: 'leads', orderBy: 'created_at', softDelete: true },
  { name: 'lead_comments', orderBy: 'created_at' },
  { name: 'lead_history', orderBy: 'created_at' },
  { name: 'meetings', orderBy: 'created_at' },
  { name: 'notes', orderBy: 'created_at' },
  { name: 'payments', orderBy: 'created_at' },
  { name: 'subscriptions', orderBy: 'created_at' },
  { name: 'support_tickets', orderBy: 'created_at' },
  { name: 'support_ticket_comments', orderBy: 'created_at' },
  { name: 'notifications', orderBy: 'created_at' },
  { name: 'system_banners', orderBy: 'created_at' },
] as const;

export type BackupTableName = (typeof BACKUP_TABLES)[number]['name'];

/**
 * Escape a value for CSV (handle commas, quotes, newlines)
 */
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';

  const str = String(value);

  // If contains comma, quote, or newline, wrap in quotes and escape inner quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Format date for CSV
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export type ExportResult = {
  success: boolean;
  content?: string;
  rowCount?: number;
  error?: string;
};

/**
 * Generic export function for any table
 * Automatically generates headers from first row
 */
export async function exportTableToCSV(
  tableName: string,
  options: {
    orderBy?: string;
    softDelete?: boolean;
  } = {}
): Promise<ExportResult> {
  const { orderBy = 'created_at', softDelete = false } = options;

  try {
    console.log(`[Export] Starting ${tableName} export...`);

    const supabase = getSupabaseAdmin();
    const BATCH_SIZE = 5000;
    let allRows: Record<string, unknown>[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase.from(tableName).select('*');

      // Apply soft delete filter if applicable
      if (softDelete) {
        query = query.is('deleted_at', null);
      }

      const { data: rows, error } = await query
        .order(orderBy, { ascending: false })
        .range(offset, offset + BATCH_SIZE - 1);

      if (error) {
        console.error(`[Export] Database error for ${tableName}:`, error);
        return { success: false, error: error.message };
      }

      if (!rows || rows.length === 0) {
        hasMore = false;
      } else {
        allRows = allRows.concat(rows);
        offset += BATCH_SIZE;
        hasMore = rows.length === BATCH_SIZE;
      }
    }

    console.log(`[Export] Total ${tableName} rows: ${allRows.length}`);

    // Build CSV content dynamically from data
    const csvRows: string[] = [];

    if (allRows.length > 0) {
      // Get headers from first row keys
      const headers = Object.keys(allRows[0]);
      csvRows.push(headers.map(escapeCSV).join(','));

      // Data rows
      for (const row of allRows) {
        const values = headers.map((key) => {
          const value = row[key];
          // Format dates
          if (
            key.endsWith('_at') &&
            typeof value === 'string' &&
            value.includes('T')
          ) {
            return escapeCSV(formatDate(value));
          }
          return escapeCSV(value);
        });
        csvRows.push(values.join(','));
      }
    }

    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const content = BOM + csvRows.join('\n');

    console.log(
      `[Export] ${tableName} CSV: ${allRows.length} rows, ${content.length} bytes`
    );

    return {
      success: true,
      content,
      rowCount: allRows.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown export error';
    console.error(`[Export] ${tableName} failed:`, message);
    return { success: false, error: message };
  }
}

/**
 * Export all tables and return results
 */
export async function exportAllTables(): Promise<{
  success: boolean;
  results: {
    table: string;
    success: boolean;
    rowCount?: number;
    content?: string;
    error?: string;
  }[];
  error?: string;
}> {
  const results: {
    table: string;
    success: boolean;
    rowCount?: number;
    content?: string;
    error?: string;
  }[] = [];

  console.log(`[Export] Starting full backup of ${BACKUP_TABLES.length} tables...`);

  for (const tableConfig of BACKUP_TABLES) {
    const result = await exportTableToCSV(tableConfig.name, {
      orderBy: tableConfig.orderBy,
      softDelete: 'softDelete' in tableConfig ? tableConfig.softDelete : false,
    });

    results.push({
      table: tableConfig.name,
      success: result.success,
      rowCount: result.rowCount,
      content: result.content,
      error: result.error,
    });

    if (!result.success) {
      console.error(`[Export] Failed to export ${tableConfig.name}: ${result.error}`);
    }
  }

  const allSuccess = results.every((r) => r.success);
  console.log(
    `[Export] Full backup complete: ${results.filter((r) => r.success).length}/${results.length} tables`
  );

  return {
    success: allSuccess,
    results,
  };
}

/**
 * Export all leads to CSV format (legacy function for backwards compatibility)
 * Uses the generic exportTableToCSV function
 */
export async function exportLeadsToCSV(): Promise<ExportResult> {
  return exportTableToCSV('leads', { orderBy: 'created_at', softDelete: true });
}

/**
 * Generate backup filename with date for a specific table
 */
export function generateBackupFilename(tableName: string = 'leads'): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  return `${tableName}-backup-${dateStr}_${timeStr}.csv`;
}
