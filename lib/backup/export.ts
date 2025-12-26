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

// CSV column headers (French labels for client)
const CSV_HEADERS = [
  'ID',
  'ID Externe',
  'Prenom',
  'Nom',
  'Email',
  'Telephone',
  'Entreprise',
  'Poste',
  'Adresse',
  'Ville',
  'Code Postal',
  'Pays',
  'Statut',
  'Source',
  'Notes',
  'Assigne A',
  'Date Creation',
  'Date Modification',
];

// Map database columns to CSV
const COLUMN_MAPPING: Record<string, string> = {
  id: 'ID',
  external_id: 'ID Externe',
  first_name: 'Prenom',
  last_name: 'Nom',
  email: 'Email',
  phone: 'Telephone',
  company: 'Entreprise',
  job_title: 'Poste',
  address: 'Adresse',
  city: 'Ville',
  postal_code: 'Code Postal',
  country: 'Pays',
  status_label: 'Statut',
  source: 'Source',
  notes: 'Notes',
  assigned_to: 'Assigne A',
  created_at: 'Date Creation',
  updated_at: 'Date Modification',
};

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

/**
 * Export all leads to CSV format
 * Returns the CSV content as a string
 */
export async function exportLeadsToCSV(): Promise<{
  success: boolean;
  content?: string;
  rowCount?: number;
  error?: string;
}> {
  try {
    console.log('[Export] Starting leads export...');

    // Get Supabase admin client (lazy initialization)
    const supabase = getSupabaseAdmin();

    // Fetch all leads with assigned user info
    // Using pagination to handle large datasets
    const BATCH_SIZE = 5000;
    let allLeads: Record<string, unknown>[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: leads, error } = await supabase
        .from('leads')
        .select(
          `
          id,
          external_id,
          first_name,
          last_name,
          email,
          phone,
          company,
          job_title,
          address,
          city,
          postal_code,
          country,
          status_label,
          source,
          notes,
          assigned_to,
          created_at,
          updated_at,
          profiles:assigned_to (display_name)
        `
        )
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + BATCH_SIZE - 1);

      if (error) {
        console.error('[Export] Database error:', error);
        return { success: false, error: error.message };
      }

      if (!leads || leads.length === 0) {
        hasMore = false;
      } else {
        allLeads = allLeads.concat(leads);
        offset += BATCH_SIZE;
        hasMore = leads.length === BATCH_SIZE;
        console.log(`[Export] Fetched ${allLeads.length} leads so far...`);
      }
    }

    console.log(`[Export] Total leads fetched: ${allLeads.length}`);

    // Build CSV content
    const rows: string[] = [];

    // Header row
    rows.push(CSV_HEADERS.join(','));

    // Data rows
    for (const lead of allLeads) {
      // Get assigned user display name
      const assignedToName =
        lead.profiles && typeof lead.profiles === 'object' && 'display_name' in lead.profiles
          ? (lead.profiles as { display_name: string }).display_name
          : '';

      const row = [
        escapeCSV(lead.id),
        escapeCSV(lead.external_id),
        escapeCSV(lead.first_name),
        escapeCSV(lead.last_name),
        escapeCSV(lead.email),
        escapeCSV(lead.phone),
        escapeCSV(lead.company),
        escapeCSV(lead.job_title),
        escapeCSV(lead.address),
        escapeCSV(lead.city),
        escapeCSV(lead.postal_code),
        escapeCSV(lead.country),
        escapeCSV(lead.status_label),
        escapeCSV(lead.source),
        escapeCSV(lead.notes),
        escapeCSV(assignedToName),
        escapeCSV(formatDate(lead.created_at as string)),
        escapeCSV(formatDate(lead.updated_at as string)),
      ];

      rows.push(row.join(','));
    }

    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const content = BOM + rows.join('\n');

    console.log(`[Export] CSV generated: ${allLeads.length} rows, ${content.length} bytes`);

    return {
      success: true,
      content,
      rowCount: allLeads.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown export error';
    console.error('[Export] Failed:', message);
    return { success: false, error: message };
  }
}

/**
 * Generate backup filename with date
 */
export function generateBackupFilename(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  return `leads-backup-${dateStr}_${timeStr}.csv`;
}
