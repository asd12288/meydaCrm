import { getAdminTrendData, getSalesTrendData } from '../lib/actions';
import { LeadsTrendChart } from '../components/leads-trend-chart';

/**
 * Async server component for admin trend chart
 * Shows assigned leads in addition to created/updated
 * Wrapped in Suspense for streaming
 */
export async function AdminTrendSection() {
  const trendData = await getAdminTrendData();

  return <LeadsTrendChart trendData={trendData} showAssigned={true} />;
}

/**
 * Async server component for sales trend chart
 * Shows only created/updated leads
 * Wrapped in Suspense for streaming
 */
export async function SalesTrendSection() {
  const trendData = await getSalesTrendData();

  return <LeadsTrendChart trendData={trendData} showAssigned={false} />;
}
