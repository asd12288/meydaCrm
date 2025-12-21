import { getAdminQuickStatsData } from '../lib/actions';
import { AdminQuickStats } from '../components/quick-stats-row';

/**
 * Async server component that fetches quick stats independently
 * Wrapped in Suspense for streaming
 */
export async function AdminQuickStatsSection() {
  const data = await getAdminQuickStatsData();

  return (
    <AdminQuickStats
      totalUsers={data.totalUsers}
      unassignedLeads={data.unassignedLeads}
      activeSales={data.activeSales}
      wonLeads={data.wonLeads}
    />
  );
}
