import { getTeamPerformanceData } from '../lib/actions';
import { SalesDistributionChart } from '../components/sales-distribution-chart';

/**
 * Async server component that fetches team distribution data independently
 * Wrapped in Suspense for streaming
 */
export async function TeamDistributionSection() {
  const data = await getTeamPerformanceData();

  return (
    <SalesDistributionChart
      teamData={data.teamPerformance}
      unassignedLeads={data.unassignedLeads}
      totalLeads={data.totalLeads}
    />
  );
}


