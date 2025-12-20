import { Suspense } from 'react';
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
      <Suspense fallback={<WelcomeCardSkeleton />}>
        <AdminWelcomeSection userName={userName} userAvatar={userAvatar} />
      </Suspense>

      {/* Quick Stats Row */}
      <Suspense fallback={<QuickStatsSkeleton />}>
        <AdminQuickStatsSection />
      </Suspense>

      {/* Status Chart + Quick Actions */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 col-span-12 flex">
          <div className="w-full">
            <Suspense fallback={<StatusChartSkeleton />}>
              <AdminStatusChartSection />
            </Suspense>
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
            <Suspense fallback={<SalesDistributionSkeleton />}>
              <TeamDistributionSection />
            </Suspense>
          </div>
        </div>
        <div className="lg:col-span-8 col-span-12 flex">
          <div className="w-full">
            <Suspense fallback={<ImportActivitySkeleton />}>
              <ImportActivitySection />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Leads Trend Chart */}
      <Suspense fallback={<TrendChartSkeleton />}>
        <AdminTrendSection />
      </Suspense>
    </div>
  );
}
