import { getMonthlyTrendData } from '../lib/actions';
import { LeadsTrendChart } from '../components/leads-trend-chart';

/**
 * Async server component for admin trend chart
 * Shows monthly leads data with year selector
 * Wrapped in Suspense for streaming
 */
export async function AdminTrendSection() {
  const trendData = await getMonthlyTrendData();

  return <LeadsTrendChart trendData={trendData} />;
}

/**
 * Async server component for sales trend chart
 * Uses same monthly data (filtered by RLS for sales user)
 * Wrapped in Suspense for streaming
 */
export async function SalesTrendSection() {
  const trendData = await getMonthlyTrendData();

  return <LeadsTrendChart trendData={trendData} />;
}


