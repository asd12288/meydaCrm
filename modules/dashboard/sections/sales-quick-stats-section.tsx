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
      newLeads={data.newLeads}
      callbackLeads={data.callbackLeads}
      wonLeads={data.wonLeads}
    />
  );
}


