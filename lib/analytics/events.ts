import posthog from 'posthog-js';

/**
 * PostHog custom event tracking for Pulse CRM.
 * Only tracks in production (client-side check).
 */

const isClient = typeof window !== 'undefined';

export const analytics = {
  // Lead Events
  leadStatusChanged: (props: {
    leadId: string;
    from: string;
    to: string;
  }) => {
    if (isClient) {
      posthog.capture('lead_status_changed', props);
    }
  },

  leadTransferred: (props: {
    leadId: string;
    fromUserId: string;
    toUserId: string;
  }) => {
    if (isClient) {
      posthog.capture('lead_transferred', props);
    }
  },

  bulkLeadsTransferred: (props: {
    leadCount: number;
    fromUserId: string;
    toUserId: string;
  }) => {
    if (isClient) {
      posthog.capture('bulk_leads_transferred', props);
    }
  },

  // Import Events
  importStarted: (props: {
    fileType: string;
    fileName: string;
  }) => {
    if (isClient) {
      posthog.capture('import_started', props);
    }
  },

  importCompleted: (props: {
    rowCount: number;
    fileType: string;
    durationMs?: number;
  }) => {
    if (isClient) {
      posthog.capture('import_completed', props);
    }
  },

  importFailed: (props: {
    error: string;
    fileType?: string;
  }) => {
    if (isClient) {
      posthog.capture('import_failed', props);
    }
  },

  // Import V2 Events
  importV2FileParsed: (props: {
    fileType: string;
    rowCount: number;
    columnCount: number;
  }) => {
    if (isClient) {
      posthog.capture('import_v2_file_parsed', props);
    }
  },

  importV2MappingCompleted: (props: {
    autoMappedCount: number;
    manualMappedCount: number;
    unmappedCount: number;
  }) => {
    if (isClient) {
      posthog.capture('import_v2_mapping_completed', props);
    }
  },

  importV2PreviewLoaded: (props: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    fileDuplicates: number;
    dbDuplicates: number;
  }) => {
    if (isClient) {
      posthog.capture('import_v2_preview_loaded', props);
    }
  },

  importV2Completed: (props: {
    totalRows: number;
    imported: number;
    updated: number;
    skipped: number;
    errors: number;
    durationMs: number;
    fileType: string;
  }) => {
    if (isClient) {
      posthog.capture('import_v2_completed', props);
    }
  },

  importV2Failed: (props: {
    error: string;
    phase: 'parsing' | 'preview' | 'import';
    fileType?: string;
  }) => {
    if (isClient) {
      posthog.capture('import_v2_failed', props);
    }
  },

  // Comment Events
  commentAdded: (props: {
    leadId: string;
  }) => {
    if (isClient) {
      posthog.capture('comment_added', props);
    }
  },

  // Search Events
  searchPerformed: (props: {
    query: string;
    resultsCount: number;
    filters?: Record<string, string>;
  }) => {
    if (isClient) {
      posthog.capture('search_performed', props);
    }
  },

  // User Events
  userCreated: (props: {
    role: string;
  }) => {
    if (isClient) {
      posthog.capture('user_created', props);
    }
  },

  loginSuccess: (props: {
    role: string;
  }) => {
    if (isClient) {
      posthog.capture('login_success', props);
    }
  },

  passwordChanged: () => {
    if (isClient) {
      posthog.capture('password_changed');
    }
  },

  // Export Events
  exportStarted: (props: {
    limit: number | null;
    hasFilters: boolean;
  }) => {
    if (isClient) {
      posthog.capture('export_started', props);
    }
  },

  exportDownloaded: (props: {
    rowCount: number;
    fileSizeBytes?: number;
  }) => {
    if (isClient) {
      posthog.capture('export_downloaded', props);
    }
  },

  // Lead Events (additional)
  leadViewed: (props: {
    leadId: string;
    status: string;
  }) => {
    if (isClient) {
      posthog.capture('lead_viewed', props);
    }
  },

  // Generic feature usage
  featureUsed: (feature: string, props?: Record<string, unknown>) => {
    if (isClient) {
      posthog.capture('feature_used', { feature, ...props });
    }
  },
};
