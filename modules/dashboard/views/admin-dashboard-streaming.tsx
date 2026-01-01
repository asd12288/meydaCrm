import { Suspense } from 'react';
import { ErrorBoundary, SectionErrorFallback } from '@/modules/shared';
import {
  AdminWelcomeSection,
  AdminQuickStatsSection,
  AdminStatusChartSection,
  TeamDistributionSection,
  ImportActivitySection,
  AdminTrendSection,
} from '../sections';
import { QuickActions } from '../components/quick-actions';
import {
  WelcomeCardSkeleton,
  QuickStatsSkeleton,
  StatusChartSkeleton,
  SalesDistributionSkeleton,
  ImportActivitySkeleton,
  TrendChartSkeleton,
} from '../ui/dashboard-skeletons';

interface AdminDashboardStreamingProps {
  userName: string;
  userAvatar?: string | null;
}

/**
 * Admin dashboard with Suspense streaming
 * Each section fetches its own data and streams in when ready
 * Shell renders immediately, skeletons show while loading
 */
export function AdminDashboardStreaming({ userName, userAvatar }: AdminDashboardStreamingProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <ErrorBoundary FallbackComponent={SectionErrorFallback}>
        <Suspense fallback={<WelcomeCardSkeleton />}>
          <AdminWelcomeSection userName={userName} userAvatar={userAvatar} />
        </Suspense>
      </ErrorBoundary>

      {/* Quick Stats Row */}
      <ErrorBoundary FallbackComponent={SectionErrorFallback}>
        <Suspense fallback={<QuickStatsSkeleton />}>
          <AdminQuickStatsSection />
        </Suspense>
      </ErrorBoundary>

      {/* Status Chart + Quick Actions */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 col-span-12 flex">
          <div className="w-full">
            <ErrorBoundary FallbackComponent={SectionErrorFallback}>
              <Suspense fallback={<StatusChartSkeleton />}>
                <AdminStatusChartSection />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
        <div className="lg:col-span-4 col-span-12 flex">
          <div className="w-full">
            {/* QuickActions is static - no data fetching needed */}
            <QuickActions />
          </div>
        </div>
      </div>

      {/* Sales Distribution + Import Activity */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-4 col-span-12 flex">
          <div className="w-full">
            <ErrorBoundary FallbackComponent={SectionErrorFallback}>
              <Suspense fallback={<SalesDistributionSkeleton />}>
                <TeamDistributionSection />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
        <div className="lg:col-span-8 col-span-12 flex">
          <div className="w-full">
            <ErrorBoundary FallbackComponent={SectionErrorFallback}>
              <Suspense fallback={<ImportActivitySkeleton />}>
                <ImportActivitySection />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* Leads Trend Chart */}
      <ErrorBoundary FallbackComponent={SectionErrorFallback}>
        <Suspense fallback={<TrendChartSkeleton />}>
          <AdminTrendSection />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}


