import { getSalesWelcomeData } from '../lib/actions';
import { WelcomeCard } from '../components/welcome-card';

interface SalesWelcomeSectionProps {
  userName: string;
  userAvatar?: string | null;
}

/**
 * Async server component that fetches sales welcome data independently
 * Wrapped in Suspense for streaming
 */
export async function SalesWelcomeSection({ userName, userAvatar }: SalesWelcomeSectionProps) {
  const data = await getSalesWelcomeData();

  return (
    <WelcomeCard
      userName={userName}
      userAvatar={userAvatar}
      totalLeads={data.totalLeads}
      trendPercentage={data.trendPercentage}
      isAdmin={false}
    />
  );
}
