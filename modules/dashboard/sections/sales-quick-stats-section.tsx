import { getSalesQuickStatsData } from '../lib/actions';
import { SalesQuickStats } from '../components/quick-stats-row';

/**
 * Async server component that fetches sales quick stats independently
 * Wrapped in Suspense for streaming
 */
export async function SalesQuickStatsSection() {
  const data = await getSalesQuickStatsData();

  return (
    <SalesQuickStats
      totalLeads={data.totalLeads}
      comments={data.commentsCount}
      activeLeads={data.activeLeads}
      wonLeads={data.wonLeads}
    />
  );
}
