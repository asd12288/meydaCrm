import { getAdminRecentActivityData, getSalesActivityData } from '../lib/actions';
import { ActivityTimeline } from '../components/activity-timeline';

/**
 * Async server component for admin activity timeline
 * Shows actor names since admin sees all activity
 * Wrapped in Suspense for streaming
 */
export async function AdminActivitySection() {
  const activities = await getAdminRecentActivityData();

  return <ActivityTimeline activities={activities} showActor={true} />;
}

/**
 * Async server component for sales activity timeline
 * Shows only the user's own activity
 * Wrapped in Suspense for streaming
 */
export async function SalesActivitySection() {
  const activities = await getSalesActivityData();

  return <ActivityTimeline activities={activities} showActor={false} />;
}


