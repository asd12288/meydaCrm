import { WelcomeCard } from '../components/welcome-card';

interface SalesWelcomeSectionProps {
  userName: string;
  userAvatar?: string | null;
}

/**
 * Simple server component for sales welcome
 */
export function SalesWelcomeSection({ userName, userAvatar }: SalesWelcomeSectionProps) {
  return <WelcomeCard userName={userName} userAvatar={userAvatar} />;
}


