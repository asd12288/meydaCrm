import { PageHeader, ErrorBoundary, SectionErrorFallback } from '@/modules/shared';
import { requireAuth } from '@/modules/auth/lib/actions';
import { getAccountStats } from '../lib/actions';
import { ROLES } from '@/lib/constants';
import {
  ProfileInfoCard,
  PasswordChangeCard,
  MyLeadsStatsCard,
} from '../components';

export async function AccountView() {
  const user = await requireAuth();
  const stats = await getAccountStats();

  if (!user.profile) {
    return (
      <div>
        <PageHeader
          title="Mon compte"
          description="Gérez vos paramètres personnels"
        />
        <div className="p-4 bg-lighterror text-error rounded-md">
          Erreur: Profil non trouvé
        </div>
      </div>
    );
  }

  const isAdmin = user.profile.role === ROLES.ADMIN;

  return (
    <div>
      <PageHeader
        title="Mon compte"
        description="Gérez vos paramètres personnels"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Profile Info */}
        <div className="space-y-6">
          <ErrorBoundary FallbackComponent={SectionErrorFallback}>
            <ProfileInfoCard profile={user.profile} email={user.email} />
          </ErrorBoundary>
          <ErrorBoundary FallbackComponent={SectionErrorFallback}>
            <PasswordChangeCard />
          </ErrorBoundary>
        </div>

        {/* Right column - Stats */}
        <div>
          <ErrorBoundary FallbackComponent={SectionErrorFallback}>
            {stats && <MyLeadsStatsCard stats={stats} isAdmin={isAdmin} />}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
