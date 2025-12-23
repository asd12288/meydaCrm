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

  // Generic feature usage
  featureUsed: (feature: string, props?: Record<string, unknown>) => {
    if (isClient) {
      posthog.capture('feature_used', { feature, ...props });
    }
  },
};
