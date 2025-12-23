'use client';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { PHProvider } from './posthog-provider';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <PHProvider>
      {children}
      {isProduction && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
    </PHProvider>
  );
}
