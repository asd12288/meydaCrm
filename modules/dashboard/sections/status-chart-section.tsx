import { getStatusChartData, getSalesStatusChartData } from '../lib/actions';
import { LeadsStatusChart } from '../components/leads-status-chart';

/**
 * Async server component for admin status chart
 * Wrapped in Suspense for streaming
 */
export async function AdminStatusChartSection() {
  const data = await getStatusChartData();

  return (
    <LeadsStatusChart
      leadsByStatus={data.leadsByStatus}
      totalLeads={data.totalLeads}
    />
  );
}

/**
 * Async server component for sales status chart
 * Wrapped in Suspense for streaming
 */
export async function SalesStatusChartSection() {
  const data = await getSalesStatusChartData();

  return (
    <LeadsStatusChart
      leadsByStatus={data.leadsByStatus}
      totalLeads={data.totalLeads}
    />
  );
}
