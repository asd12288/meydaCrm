/**
 * Export Module Types
 */

// ============================================================================
// JOB STATUS
// ============================================================================

export type ExportStatus =
  | 'pending'     // Job created, waiting in queue
  | 'processing'  // Worker actively generating CSV
  | 'completed'   // File ready for download
  | 'failed'      // Job failed
  | 'expired';    // File was deleted after expiration

// ============================================================================
// EXPORT FILTERS
// ============================================================================

export interface ExportFilters {
  search?: string;
  status?: string;
  assignedTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// EXPORT JOB
// ============================================================================

export interface ExportJob {
  id: string;
  user_id: string;
  status: ExportStatus;
  filters: ExportFilters | null;
  limit_rows: number | null;
  estimated_rows: number | null;
  processed_rows: number;
  total_rows: number | null;
  file_path: string | null;
  file_size_bytes: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  error_message: string | null;
}

// ============================================================================
// QUEUE PAYLOADS
// ============================================================================

export interface ExportJobPayload {
  exportJobId: string;
}

// ============================================================================
// ACTION RESULTS
// ============================================================================

export interface CreateExportResult {
  success: boolean;
  exportJobId?: string;
  error?: string;
}

export interface ExportDownloadResult {
  url: string | null;
  error?: string;
}
