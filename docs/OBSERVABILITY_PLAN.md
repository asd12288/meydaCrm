# Full Observability Plan - Pulse CRM

## Overview

Add comprehensive analytics and monitoring **invisible to CRM users** - all dashboards are external.

| Tool | Purpose | Dashboard |
|------|---------|-----------|
| Vercel Analytics | Traffic, page views, geography | vercel.com/analytics |
| Vercel Speed Insights | Core Web Vitals, performance | vercel.com/speed-insights |
| PostHog | Product analytics, session replays | eu.posthog.com |
| Sentry | Error tracking, performance | sentry.io |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Pulse CRM (Next.js)                    │
├─────────────────────────────────────────────────────────────┤
│  app/layout.tsx                                             │
│  └── <AnalyticsProvider>  ← Single wrapper, invisible       │
│       ├── Vercel Analytics (automatic page tracking)        │
│       ├── Speed Insights (automatic vitals)                 │
│       ├── PostHog (custom events + session replay)          │
│       └── Sentry (error boundary + performance)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Dashboards                        │
│  (Only YOU see these - not CRM users)                       │
├─────────────────────────────────────────────────────────────┤
│  • vercel.com/[team]/crm/analytics                          │
│  • vercel.com/[team]/crm/speed-insights                     │
│  • eu.posthog.com/project/[id]                              │
│  • sentry.io/organizations/[org]/issues                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Vercel Analytics + Speed Insights

### What You Get
- **Page views**: Which pages are visited most
- **Unique visitors**: Daily/weekly/monthly
- **Geographic data**: Where users are (France, etc.)
- **Referrers**: How users found the app
- **Core Web Vitals**: LCP, FID, CLS, TTFB
- **Performance scores**: Real user metrics

### Implementation

```bash
npm install @vercel/analytics @vercel/speed-insights
```

```tsx
// lib/analytics/vercel.tsx
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export function VercelAnalytics() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
```

### Cost
- **Free**: 2,500 events/month (enough for small team)
- **Pro**: Included with Vercel Pro ($20/mo)

---

## 2. PostHog - Product Analytics

### What You Get
- **Custom Events**: Track specific actions (lead created, import completed)
- **Session Replays**: Watch user sessions (debug issues)
- **User Identification**: See which sales user did what
- **Funnels**: Track conversion paths
- **Feature Flags**: A/B test new features (future)
- **Heatmaps**: Click/scroll tracking

### Implementation

```bash
npm install posthog-js
```

```tsx
// lib/analytics/posthog.tsx
'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY!;
const POSTHOG_HOST = 'https://eu.i.posthog.com'; // EU for GDPR

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && POSTHOG_KEY) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true, // Auto-track clicks, form submissions
        session_recording: {
          maskAllInputs: true, // Privacy: mask form inputs
          maskTextSelector: '[data-mask]', // Custom masking
        },
        persistence: 'localStorage',
        loaded: (ph) => {
          if (process.env.NODE_ENV === 'development') {
            // Disable in dev to avoid noise
            ph.opt_out_capturing();
          }
        },
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
```

### Custom Events to Track

```typescript
// lib/analytics/events.ts
import posthog from 'posthog-js';

export const analytics = {
  // User identification (call after login)
  identify: (userId: string, properties: {
    role: string;
    displayName: string;
  }) => {
    posthog.identify(userId, properties);
  },

  // Lead events
  leadCreated: (props: { source: 'manual' | 'import'; status: string }) => {
    posthog.capture('lead_created', props);
  },

  leadStatusChanged: (props: {
    leadId: string;
    from: string;
    to: string;
    userId: string;
  }) => {
    posthog.capture('lead_status_changed', props);
  },

  leadTransferred: (props: {
    leadId: string;
    fromUser: string;
    toUser: string;
    actorId: string;
  }) => {
    posthog.capture('lead_transferred', props);
  },

  bulkTransfer: (props: {
    leadCount: number;
    fromUser: string;
    toUser: string;
  }) => {
    posthog.capture('bulk_transfer', props);
  },

  // Import events
  importStarted: (props: { fileType: 'csv' | 'xlsx'; rowCount: number }) => {
    posthog.capture('import_started', props);
  },

  importCompleted: (props: {
    fileType: string;
    totalRows: number;
    validRows: number;
    errorRows: number;
    durationMs: number;
  }) => {
    posthog.capture('import_completed', props);
  },

  importFailed: (props: { fileType: string; error: string }) => {
    posthog.capture('import_failed', props);
  },

  // User management
  userCreated: (props: { role: string; createdBy: string }) => {
    posthog.capture('user_created', props);
  },

  passwordReset: (props: { targetUserId: string; resetBy: string }) => {
    posthog.capture('password_reset', props);
  },

  // Feature usage
  featureUsed: (feature: string, props?: Record<string, unknown>) => {
    posthog.capture('feature_used', { feature, ...props });
  },

  // Search & filters
  searchPerformed: (props: { query: string; resultsCount: number }) => {
    posthog.capture('search_performed', props);
  },

  filterApplied: (props: { filterType: string; value: string }) => {
    posthog.capture('filter_applied', props);
  },

  // Comments
  commentAdded: (props: { leadId: string; userId: string }) => {
    posthog.capture('comment_added', props);
  },

  // Meetings
  meetingScheduled: (props: { leadId: string; userId: string }) => {
    posthog.capture('meeting_scheduled', props);
  },

  // Export
  exportRequested: (props: { format: string; rowCount: number }) => {
    posthog.capture('export_requested', props);
  },
};
```

### Cost
- **Free**: 1M events/month + 5K session replays
- **Paid**: $0.00031/event after free tier

---

## 3. Sentry - Error Tracking

### What You Get
- **Error Tracking**: JS errors with full stack traces
- **Performance Monitoring**: Slow pages, API calls
- **Session Replay**: See what user did before error
- **Alerts**: Email/Slack on new errors
- **Release Tracking**: Know which deploy caused issues

### Implementation

```bash
npx @sentry/wizard@latest -i nextjs
```

This wizard will:
1. Create `sentry.client.config.ts`
2. Create `sentry.server.config.ts`
3. Create `sentry.edge.config.ts`
4. Update `next.config.ts`
5. Create `.env.sentry-build-plugin`

### Manual Configuration

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only track in production
  enabled: process.env.NODE_ENV === 'production',

  // Performance monitoring
  tracesSampleRate: 0.1, // 10% of transactions

  // Session replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      maskAllInputs: true, // Privacy
    }),
  ],

  // Filter out noise
  ignoreErrors: [
    'ResizeObserver loop',
    'Network request failed',
    'Load failed',
  ],

  // Tag errors with environment
  environment: process.env.VERCEL_ENV || 'development',
});
```

### Custom Error Context

```typescript
// lib/analytics/sentry.ts
import * as Sentry from '@sentry/nextjs';

export const errorTracking = {
  // Set user context after login
  setUser: (user: { id: string; role: string; displayName: string }) => {
    Sentry.setUser({
      id: user.id,
      username: user.displayName,
      role: user.role,
    });
  },

  // Clear on logout
  clearUser: () => {
    Sentry.setUser(null);
  },

  // Track breadcrumbs for context
  addBreadcrumb: (message: string, category: string, data?: Record<string, unknown>) => {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  },

  // Capture custom error with context
  captureError: (error: Error, context?: Record<string, unknown>) => {
    Sentry.captureException(error, {
      extra: context,
    });
  },

  // Capture message (for warnings/info)
  captureMessage: (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
    Sentry.captureMessage(message, level);
  },
};
```

### Cost
- **Free**: 5K errors/month + 10K transactions
- **Team**: $26/month (50K errors)

---

## 4. Combined Analytics Provider

```tsx
// lib/analytics/provider.tsx
'use client';

import { VercelAnalytics } from './vercel';
import { PostHogProvider } from './posthog';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  // Only enable in production
  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <>
      {isProduction && <VercelAnalytics />}
      <PostHogProvider>
        {children}
      </PostHogProvider>
    </>
  );
}
```

### Integration in Layout

```tsx
// app/layout.tsx
import { AnalyticsProvider } from '@/lib/analytics/provider';

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <ThemeProvider>
          <ToastProvider>
            <AnalyticsProvider>
              {children}
            </AnalyticsProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## 5. User Identification (Link Events to Users)

```tsx
// modules/auth/hooks/use-analytics-identity.ts
'use client';

import { useEffect } from 'react';
import { analytics } from '@/lib/analytics/events';
import { errorTracking } from '@/lib/analytics/sentry';

export function useAnalyticsIdentity(user: {
  id: string;
  role: string;
  displayName: string;
} | null) {
  useEffect(() => {
    if (user) {
      // Identify in PostHog
      analytics.identify(user.id, {
        role: user.role,
        displayName: user.displayName,
      });

      // Set Sentry user context
      errorTracking.setUser(user);
    } else {
      errorTracking.clearUser();
    }
  }, [user]);
}
```

```tsx
// app/(protected)/layout.tsx - Add identity hook
import { useAnalyticsIdentity } from '@/modules/auth/hooks/use-analytics-identity';

// Inside DashboardLayout component:
useAnalyticsIdentity(profile);
```

---

## 6. Environment Variables

```bash
# .env.local (add these)

# PostHog (get from eu.posthog.com)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxx

# Sentry (get from sentry.io)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxxxx  # For source maps
SENTRY_ORG=your-org
SENTRY_PROJECT=pulse-crm

# Vercel Analytics (auto-configured on Vercel)
# No env vars needed - just install the package
```

---

## 7. What Gets Tracked (Summary)

### Automatic (Zero Code)
| What | Tool |
|------|------|
| Page views | Vercel Analytics |
| Web Vitals (LCP, FID, CLS) | Speed Insights |
| Button clicks | PostHog autocapture |
| Form submissions | PostHog autocapture |
| JS errors | Sentry |
| Session replays | PostHog + Sentry |

### Custom Events (Add Code)
| Event | When | Properties |
|-------|------|------------|
| `lead_created` | Lead added | source, status |
| `lead_status_changed` | Status update | from, to, userId |
| `lead_transferred` | Single transfer | fromUser, toUser |
| `bulk_transfer` | Bulk transfer | leadCount, fromUser, toUser |
| `import_started` | Import begins | fileType, rowCount |
| `import_completed` | Import done | totalRows, validRows, durationMs |
| `import_failed` | Import error | error message |
| `user_created` | Admin creates user | role |
| `search_performed` | User searches | query, resultsCount |
| `filter_applied` | Filter used | filterType, value |
| `comment_added` | Comment posted | leadId |
| `meeting_scheduled` | Meeting created | leadId |
| `export_requested` | Data export | format, rowCount |

---

## 8. Privacy & Data Masking

### What's Masked (GDPR Compliant)
- Form inputs (passwords, personal data)
- Custom elements with `data-mask` attribute
- Sensitive text in session replays

```tsx
// Example: Mask sensitive data
<input type="password" data-mask />
<span data-mask>{lead.phone}</span>
```

### User Opt-Out
If needed, add opt-out capability:

```typescript
// User can opt out
posthog.opt_out_capturing();

// Check status
posthog.has_opted_out_capturing();

// Opt back in
posthog.opt_in_capturing();
```

---

## 9. Dashboard Access

After setup, you'll have these dashboards:

| Dashboard | URL | What You See |
|-----------|-----|--------------|
| Vercel Analytics | `vercel.com/[team]/crm/analytics` | Traffic, visitors |
| Speed Insights | `vercel.com/[team]/crm/speed-insights` | Performance |
| PostHog | `eu.posthog.com/project/[id]` | Events, replays, funnels |
| Sentry | `sentry.io/organizations/[org]` | Errors, performance |

**CRM users never see these** - they're completely separate from the app.

---

## 10. Implementation Order

1. **Vercel Analytics** (5 min) - Install packages, add to layout
2. **PostHog Setup** (15 min) - Create account, add provider
3. **Sentry Setup** (15 min) - Run wizard, configure
4. **User Identity** (10 min) - Link events to users
5. **Custom Events** (30 min) - Add tracking to key actions
6. **Test & Verify** (15 min) - Confirm data flows

**Total: ~1.5 hours**

---

## 11. Files to Create/Modify

### New Files
```
lib/analytics/
├── provider.tsx       # Combined analytics provider
├── vercel.tsx         # Vercel Analytics component
├── posthog.tsx        # PostHog provider + config
├── events.ts          # Custom event tracking functions
├── sentry.ts          # Sentry helper functions
└── index.ts           # Barrel exports
```

### Modified Files
```
app/layout.tsx                    # Add AnalyticsProvider
app/(protected)/layout.tsx        # Add user identification
next.config.ts                    # Sentry webpack config (auto)
.env.local                        # Add API keys
package.json                      # New dependencies
```

---

## Approval Needed

Ready to implement this plan?

- [ ] Confirm you want all 3 tools (Vercel + PostHog + Sentry)
- [ ] Create PostHog account at https://eu.posthog.com (EU for GDPR)
- [ ] Create Sentry account at https://sentry.io
- [ ] Let me know and I'll start implementation

---

## Cost Summary

| Tool | Free Tier | Paid (if needed) |
|------|-----------|------------------|
| Vercel Analytics | 2.5K events/mo | Included in Pro |
| Speed Insights | 10K data points/mo | Included in Pro |
| PostHog | 1M events + 5K replays | $0.00031/event |
| Sentry | 5K errors + 10K transactions | $26/mo |

**For a small team CRM: Free tier should be sufficient.**
