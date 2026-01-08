import { Sidebar } from '../components/sidebar';
import { Header } from '../components/header';
import { MainContent } from '../components/main-content';
import { SidebarProvider } from '../context/sidebar-context';
import { ExpiryWarningBanner } from '@/modules/subscription/components/expiry-warning-banner';
import { BannerProvider, BannerContainer } from '@/modules/shared';
import { AccountSwitcherProvider } from '@/lib/account-switcher';
import { AddAccountModal } from '@/modules/auth';
import type { NormalizedProfile } from '@/lib/auth';

interface SubscriptionInfo {
  showWarning: boolean;
  daysRemaining: number | null;
  isGrace?: boolean;
  graceDaysRemaining?: number | null;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  profile: NormalizedProfile;
  subscription?: SubscriptionInfo;
}

export function DashboardLayout({ children, profile, subscription }: DashboardLayoutProps) {
  // Show subscription banner if approaching expiry OR in grace period
  const showSubscriptionBanner =
    (subscription?.showWarning && subscription.daysRemaining !== null) ||
    subscription?.isGrace;

  return (
    <BannerProvider>
      <AccountSwitcherProvider
        currentUserId={profile.id}
        currentUserProfile={{
          displayName: profile.displayName,
          role: profile.role,
          avatar: profile.avatar,
        }}
      >
        <SidebarProvider>
          <div className="min-h-screen bg-lightgray dark:bg-darkgray">
            {/* Fixed Sidebar */}
            <Sidebar userRole={profile.role} />

            {/* Main content area with margin for sidebar */}
            <MainContent>
              {/* Fixed Header */}
              <Header
                displayName={profile.displayName}
                role={profile.role}
                avatar={profile.avatar}
              />

              {/* System banners (warnings, welcome messages, etc.) */}
              <BannerContainer />

              {/* Subscription expiry warning banner */}
              {showSubscriptionBanner && (
                <div className="sticky top-16 z-20">
                  <ExpiryWarningBanner
                    daysRemaining={subscription?.daysRemaining ?? 0}
                    isGrace={subscription?.isGrace}
                    graceDaysRemaining={subscription?.graceDaysRemaining}
                  />
                </div>
              )}

              {/* Scrollable main content */}
              <main className="p-4 lg:p-5 xl:p-6">
                <div className="max-w-400 mx-auto">
                  {children}
                </div>
              </main>
            </MainContent>

            {/* Add account modal */}
            <AddAccountModal />
          </div>
        </SidebarProvider>
      </AccountSwitcherProvider>
    </BannerProvider>
  );
}
