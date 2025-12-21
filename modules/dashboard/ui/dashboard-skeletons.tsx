import { CardBox } from '@/modules/shared';

/**
 * Skeleton for the welcome card (gradient banner with avatar)
 * Uses dashboard-welcome class for consistent professional blue gradient
 */
export function WelcomeCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl dashboard-welcome p-6 animate-pulse">
      <div className="flex items-end justify-between min-h-[140px]">
        {/* Left: Welcome text and stats */}
        <div className="flex-1 z-10 pb-2">
          <div className="skeleton bg-white/20 w-16 h-4 rounded mb-2" />
          <div className="skeleton bg-white/30 w-40 h-7 rounded mb-5" />

          {/* Stats pills */}
          <div className="flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur-sm rounded-full px-5 py-3">
              <div className="skeleton bg-white/30 w-20 h-8 rounded mb-1" />
              <div className="skeleton bg-white/20 w-16 h-3 rounded" />
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-full px-5 py-3">
              <div className="skeleton bg-white/30 w-16 h-7 rounded mb-1" />
              <div className="skeleton bg-white/20 w-14 h-3 rounded" />
            </div>
          </div>
        </div>

        {/* Right: Avatar placeholder */}
        <div className="relative z-10 hidden sm:block self-end -mb-6 -mr-2">
          <div className="skeleton bg-white/10 w-44 h-44 lg:w-52 lg:h-52 rounded-full" />
        </div>
      </div>

      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-white/5 rounded-full" />
    </div>
  );
}

/**
 * Skeleton for quick stats row (4 stat cards)
 */
export function QuickStatsSkeleton() {
  return (
    <CardBox>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-xl bg-lightgray dark:bg-darkgray animate-pulse"
          >
            <div className="skeleton w-12 h-12 rounded-xl" />
            <div>
              <div className="skeleton skeleton-text w-16 h-7 mb-1" />
              <div className="skeleton skeleton-text w-20 h-3" />
            </div>
          </div>
        ))}
      </div>
    </CardBox>
  );
}

/**
 * Skeleton for status chart (donut chart + legend)
 */
export function StatusChartSkeleton() {
  return (
    <CardBox className="h-full">
      <div className="skeleton skeleton-text w-40 h-5 mb-6" />
      
      <div className="grid grid-cols-12 gap-6 items-center">
        {/* Chart placeholder */}
        <div className="lg:col-span-6 col-span-12 flex justify-center">
          <div className="skeleton w-[200px] h-[200px] rounded-full" />
        </div>
        
        {/* Legend placeholders */}
        <div className="lg:col-span-6 col-span-12">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="skeleton w-10 h-10 rounded-lg" />
                <div className="flex-1">
                  <div className="skeleton skeleton-text w-24 h-4 mb-1" />
                  <div className="skeleton skeleton-text w-16 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CardBox>
  );
}

/**
 * Skeleton for quick actions (static links)
 */
export function QuickActionsSkeleton() {
  return (
    <CardBox className="h-full">
      <div className="skeleton skeleton-text w-32 h-5 mb-4" />
      
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg animate-pulse"
          >
            <div className="skeleton w-10 h-10 rounded-lg" />
            <div className="flex-1">
              <div className="skeleton skeleton-text w-28 h-4 mb-1" />
              <div className="skeleton skeleton-text w-20 h-3" />
            </div>
          </div>
        ))}
      </div>
    </CardBox>
  );
}

/**
 * Skeleton for sales distribution chart (bar progress)
 */
export function SalesDistributionSkeleton() {
  // Deterministic widths for skeleton bars (varying to look natural)
  const barWidths = [75, 60, 45, 35, 25, 20];

  return (
    <CardBox className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton skeleton-text w-44 h-5" />
        <div className="skeleton w-24 h-6 rounded-full" />
      </div>

      <div className="space-y-3">
        {barWidths.map((width, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="skeleton skeleton-text w-24 h-4" />
                <div className="skeleton skeleton-text w-12 h-3" />
              </div>
              <div className="h-1.5 bg-lightgray dark:bg-darkborder rounded-full overflow-hidden">
                <div 
                  className="skeleton h-full rounded-full" 
                  style={{ width: `${width}%` }} 
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardBox>
  );
}

/**
 * Skeleton for import activity table
 */
export function ImportActivitySkeleton() {
  return (
    <CardBox className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton skeleton-text w-32 h-5" />
        <div className="skeleton skeleton-text w-16 h-4" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border dark:border-darkborder">
              <th className="text-left py-3">
                <div className="skeleton skeleton-text w-16 h-3" />
              </th>
              <th className="text-left py-3">
                <div className="skeleton skeleton-text w-12 h-3" />
              </th>
              <th className="text-left py-3">
                <div className="skeleton skeleton-text w-14 h-3" />
              </th>
              <th className="text-right py-3">
                <div className="skeleton skeleton-text w-16 h-3 ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-border dark:border-darkborder last:border-0 animate-pulse">
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="skeleton w-5 h-5 rounded" />
                    <div className="skeleton skeleton-text w-32 h-4" />
                  </div>
                </td>
                <td className="py-3">
                  <div className="skeleton skeleton-text w-20 h-4" />
                </td>
                <td className="py-3">
                  <div className="skeleton w-16 h-6 rounded-full" />
                </td>
                <td className="py-3 text-right">
                  <div className="skeleton skeleton-text w-16 h-4 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardBox>
  );
}

/**
 * Skeleton for leads trend chart (bar chart)
 */
export function TrendChartSkeleton() {
  // Deterministic heights for chart bars (varying to look like a trend)
  const barHeights = [80, 120, 90, 150, 110, 180, 140, 200, 160, 130, 170, 190, 140, 160, 180];

  return (
    <CardBox>
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton skeleton-text w-36 h-5" />
        <div className="skeleton w-32 h-9 rounded-lg" />
      </div>

      {/* Chart area placeholder */}
      <div className="h-[320px] flex items-end justify-between gap-1 px-4 animate-pulse">
        {barHeights.map((height, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end gap-1">
            <div 
              className="skeleton w-full rounded-t" 
              style={{ height: `${height}px` }} 
            />
          </div>
        ))}
      </div>
      
      {/* X-axis labels placeholder */}
      <div className="flex justify-between px-4 mt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-text w-10 h-3" />
        ))}
      </div>
    </CardBox>
  );
}

/**
 * Skeleton for notes widget (1 row of 4 post-it notes)
 */
export function NotesWidgetSkeleton() {
  // Post-it background colors matching the real component
  const noteColors = [
    'post-it-bg-yellow',
    'post-it-bg-pink',
    'post-it-bg-blue',
    'post-it-bg-green',
  ];

  return (
    <CardBox>
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton skeleton-text w-24 h-5" />
        <div className="skeleton skeleton-text w-20 h-4" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {noteColors.map((colorClass, i) => (
          <div
            key={i}
            className={`post-it-inner relative animate-pulse ${colorClass}`}
            style={{ minHeight: '140px' }}
          >
            {/* Folded corner */}
            <div className="post-it-fold" />

            {/* Content area */}
            <div className="post-it-content">
              <div className="skeleton bg-gray-600/20 w-3/4 h-4 rounded mb-2" />
              <div className="skeleton bg-gray-600/15 w-full h-3 rounded mb-1" />
              <div className="skeleton bg-gray-600/15 w-2/3 h-3 rounded" />
            </div>

            {/* Footer */}
            <div className="post-it-footer">
              <div className="skeleton bg-gray-600/15 w-16 h-3 rounded" />
              <div className="skeleton bg-gray-600/15 w-12 h-3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </CardBox>
  );
}

/**
 * Skeleton for activity timeline
 */
export function ActivityTimelineSkeleton() {
  return (
    <CardBox className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton skeleton-text w-32 h-5" />
        <div className="skeleton skeleton-text w-16 h-4" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="skeleton w-9 h-9 rounded-lg flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="skeleton skeleton-text w-32 h-4 mb-1" />
                  <div className="skeleton skeleton-text w-24 h-3" />
                </div>
                <div className="skeleton w-16 h-5 rounded-full flex-shrink-0" />
              </div>
              <div className="skeleton skeleton-text w-16 h-3 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </CardBox>
  );
}

/**
 * Full admin dashboard page skeleton
 * Used in loading.tsx for instant feedback
 */
export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <WelcomeCardSkeleton />

      {/* Quick Stats Row */}
      <QuickStatsSkeleton />

      {/* Status Chart + Quick Actions */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 col-span-12 flex">
          <div className="w-full">
            <StatusChartSkeleton />
          </div>
        </div>
        <div className="lg:col-span-4 col-span-12 flex">
          <div className="w-full">
            <QuickActionsSkeleton />
          </div>
        </div>
      </div>

      {/* Sales Distribution + Import Activity */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-4 col-span-12 flex">
          <div className="w-full">
            <SalesDistributionSkeleton />
          </div>
        </div>
        <div className="lg:col-span-8 col-span-12 flex">
          <div className="w-full">
            <ImportActivitySkeleton />
          </div>
        </div>
      </div>

      {/* Leads Trend Chart */}
      <TrendChartSkeleton />
    </div>
  );
}

/**
 * Full sales dashboard page skeleton
 * Used in loading.tsx for instant feedback
 */
export function SalesDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <WelcomeCardSkeleton />

      {/* Quick Stats Row */}
      <QuickStatsSkeleton />

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Leads by Status */}
        <div className="lg:col-span-7 col-span-12">
          <StatusChartSkeleton />
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-5 col-span-12">
          <ActivityTimelineSkeleton />
        </div>
      </div>

      {/* Notes Widget */}
      <NotesWidgetSkeleton />
    </div>
  );
}

/**
 * Generic dashboard page skeleton
 * Detects role and shows appropriate skeleton
 */
export function DashboardPageSkeleton() {
  // Default to admin skeleton as it's more comprehensive
  return <AdminDashboardSkeleton />;
}
