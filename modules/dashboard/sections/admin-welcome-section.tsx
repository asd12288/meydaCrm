import { WelcomeCard } from '../components/welcome-card';

interface AdminWelcomeSectionProps {
  userName: string;
  userAvatar?: string | null;
}

/**
 * Simple server component for admin welcome
 */
export function AdminWelcomeSection({ userName, userAvatar }: AdminWelcomeSectionProps) {
  return <WelcomeCard userName={userName} userAvatar={userAvatar} />;
}
