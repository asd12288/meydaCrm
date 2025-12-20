import { Sidebar } from '../components/sidebar';
import { Header } from '../components/header';
import { MainContent } from '../components/main-content';
import { SidebarProvider } from '../context/sidebar-context';
import type { NormalizedProfile } from '@/lib/auth';

interface DashboardLayoutProps {
  children: React.ReactNode;
  profile: NormalizedProfile;
}

export function DashboardLayout({ children, profile }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-lightgray dark:bg-dark">
        <Sidebar userRole={profile.role} />

        <MainContent>
          <Header
            displayName={profile.displayName}
            role={profile.role}
            avatar={profile.avatar}
          />

          <main className="p-6 min-h-[calc(100vh-70px)]">{children}</main>
        </MainContent>
      </div>
    </SidebarProvider>
  );
}
