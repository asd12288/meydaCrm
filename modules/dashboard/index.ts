// Actions - Section-specific functions for Suspense streaming
export {
  // Admin section data
  getAdminWelcomeData,
  getAdminQuickStatsData,
  getStatusChartData,
  getStatusChartDataFiltered,
  getTeamPerformanceData,
  getImportActivityData,
  getMonthlyTrendData,
  getAdminRecentActivityData,
  // Sales section data
  getSalesWelcomeData,
  getSalesQuickStatsData,
  getSalesStatusChartData,
  getSalesActivityData,
  // Types
  type WelcomeData,
  type AdminQuickStatsData,
  type StatusChartData,
  type TeamPerformanceData,
  type SalesQuickStatsData,
} from './lib/actions';

// UI - Skeletons
export {
  WelcomeCardSkeleton,
  QuickStatsSkeleton,
  StatusChartSkeleton,
  QuickActionsSkeleton,
  SalesDistributionSkeleton,
  ImportActivitySkeleton,
  TrendChartSkeleton,
  ActivityTimelineSkeleton,
  AdminDashboardSkeleton,
  SalesDashboardSkeleton,
  DashboardPageSkeleton,
} from './ui/dashboard-skeletons';

// Types
export type {
  SalesDashboardData,
  AdminDashboardData,
  ActivityItem,
  TeamPerformanceItem,
  ImportActivityItem,
  LeadsTrendPoint,
  MonthlyTrendPoint,
  TrendYearsData,
  ChartSeries,
  ChartData,
  ChartTimePeriod,
} from './types';

// Components
export { StatCard } from './components/stat-card';
export { WelcomeCard } from './components/welcome-card';
export { QuickStatsRow, SalesQuickStats, AdminQuickStats } from './components/quick-stats-row';
export { LeadsStatusChart } from './components/leads-status-chart';
export { SalesDistributionChart } from './components/sales-distribution-chart';
export { QuickActions } from './components/quick-actions';
export { ActivityTimeline } from './components/activity-timeline';
export { LeadsTrendChart } from './components/leads-trend-chart';
export { TeamPerformanceChart } from './components/team-performance-chart';
export { ImportActivityTable } from './components/import-activity-table';
export { RecentActivityFeed } from './components/recent-activity-feed';

// Sections - Async server components for Suspense streaming
export {
  // Admin sections
  AdminWelcomeSection,
  AdminQuickStatsSection,
  AdminStatusChartSection,
  TeamDistributionSection,
  ImportActivitySection,
  AdminTrendSection,
  AdminActivitySection,
  // Sales sections
  SalesWelcomeSection,
  SalesQuickStatsSection,
  SalesStatusChartSection,
  SalesActivitySection,
  SalesTrendSection,
} from './sections';

// Views - Streaming (with Suspense boundaries)
export { AdminDashboardStreaming } from './views/admin-dashboard-streaming';
export { SalesDashboardStreaming } from './views/sales-dashboard-streaming';


