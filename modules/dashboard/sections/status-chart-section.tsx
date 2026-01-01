import { getStatusChartDataFiltered, getSalesStatusChartData } from '../lib/actions';
import { LeadsStatusChart } from '../components/leads-status-chart';

/**
 * Async server component for admin status chart
 * Wrapped in Suspense for streaming
 * Default period: month (last 30 days)
 */
export async function AdminStatusChartSection() {
  const data = await getStatusChartDataFiltered('month');

  return (
    <LeadsStatusChart
      leadsByStatus={data.leadsByStatus}
      totalLeads={data.totalLeads}
      initialPeriod="month"
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


