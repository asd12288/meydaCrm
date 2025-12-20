import { getAdminWelcomeData } from '../lib/actions';
import { WelcomeCard } from '../components/welcome-card';

interface AdminWelcomeSectionProps {
  userName: string;
  userAvatar?: string | null;
}

/**
 * Async server component that fetches welcome data independently
 * Wrapped in Suspense for streaming
 */
export async function AdminWelcomeSection({ userName, userAvatar }: AdminWelcomeSectionProps) {
  const data = await getAdminWelcomeData();

  return (
    <WelcomeCard
      userName={userName}
      userAvatar={userAvatar}
      totalLeads={data.totalLeads}
      trendPercentage={data.trendPercentage}
      isAdmin={true}
    />
  );
}
