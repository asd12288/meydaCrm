import { Sidebar } from '../components/sidebar';
import { Header } from '../components/header';
import type { Profile } from '@/db/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  profile: Profile;
}

export function DashboardLayout({ children, profile }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-lightgray dark:bg-dark">
      <Sidebar userRole={profile.role} />

      <div className="flex-1 ml-64">
        <Header displayName={profile.displayName} role={profile.role} />

        <main className="p-6 min-h-[calc(100vh-70px)]">{children}</main>
      </div>
    </div>
  );
}
