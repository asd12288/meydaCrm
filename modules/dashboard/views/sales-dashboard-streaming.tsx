import { Suspense } from 'react';
import { ErrorBoundary, SectionErrorFallback } from '@/modules/shared';
import {
  SalesWelcomeSection,
  SalesQuickStatsSection,
  SalesStatusChartSection,
  SalesActivitySection,
  SalesNotesSection,
  SalesMeetingsSection,
} from '../sections';
import {
  WelcomeCardSkeleton,
  QuickStatsSkeleton,
  StatusChartSkeleton,
  ActivityTimelineSkeleton,
  NotesWidgetSkeleton,
  MeetingsSkeleton,
} from '../ui/dashboard-skeletons';

interface SalesDashboardStreamingProps {
  userName: string;
  userAvatar?: string | null;
}

/**
 * Sales dashboard with Suspense streaming
 * Each section fetches its own data and streams in when ready
 * Shell renders immediately, skeletons show while loading
 */
export function SalesDashboardStreaming({ userName, userAvatar }: SalesDashboardStreamingProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <ErrorBoundary FallbackComponent={SectionErrorFallback}>
        <Suspense fallback={<WelcomeCardSkeleton />}>
          <SalesWelcomeSection userName={userName} userAvatar={userAvatar} />
        </Suspense>
      </ErrorBoundary>

      {/* Quick Stats Row */}
      <ErrorBoundary FallbackComponent={SectionErrorFallback}>
        <Suspense fallback={<QuickStatsSkeleton />}>
          <SalesQuickStatsSection />
        </Suspense>
      </ErrorBoundary>

      {/* Meetings Widget */}
      <ErrorBoundary FallbackComponent={SectionErrorFallback}>
        <Suspense fallback={<MeetingsSkeleton />}>
          <SalesMeetingsSection />
        </Suspense>
      </ErrorBoundary>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Leads by Status */}
        <div className="lg:col-span-7 col-span-12">
          <ErrorBoundary FallbackComponent={SectionErrorFallback}>
            <Suspense fallback={<StatusChartSkeleton />}>
              <SalesStatusChartSection />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-5 col-span-12">
          <ErrorBoundary FallbackComponent={SectionErrorFallback}>
            <Suspense fallback={<ActivityTimelineSkeleton />}>
              <SalesActivitySection />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>

      {/* Notes Widget */}
      <ErrorBoundary FallbackComponent={SectionErrorFallback}>
        <Suspense fallback={<NotesWidgetSkeleton />}>
          <SalesNotesSection />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}


