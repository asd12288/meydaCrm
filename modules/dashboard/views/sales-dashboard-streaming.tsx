import { Suspense } from 'react';
import {
  SalesWelcomeSection,
  SalesQuickStatsSection,
  SalesStatusChartSection,
  SalesActivitySection,
  SalesTrendSection,
} from '../sections';
import {
  WelcomeCardSkeleton,
  QuickStatsSkeleton,
  StatusChartSkeleton,
  ActivityTimelineSkeleton,
  TrendChartSkeleton,
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
      <Suspense fallback={<WelcomeCardSkeleton />}>
        <SalesWelcomeSection userName={userName} userAvatar={userAvatar} />
      </Suspense>

      {/* Quick Stats Row */}
      <Suspense fallback={<QuickStatsSkeleton />}>
        <SalesQuickStatsSection />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Leads by Status */}
        <div className="lg:col-span-7 col-span-12">
          <Suspense fallback={<StatusChartSkeleton />}>
            <SalesStatusChartSection />
          </Suspense>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-5 col-span-12">
          <Suspense fallback={<ActivityTimelineSkeleton />}>
            <SalesActivitySection />
          </Suspense>
        </div>
      </div>

      {/* Leads Trend Chart */}
      <Suspense fallback={<TrendChartSkeleton />}>
        <SalesTrendSection />
      </Suspense>
    </div>
  );
}
