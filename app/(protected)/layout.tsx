import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardLayout } from '@/modules/layout';
import { getProfile, createDefaultProfile } from '@/lib/auth';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Get session - middleware already validated auth
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session, middleware should have redirected - but handle edge case
  if (!session?.user) {
    redirect('/login');
  }

  // Fetch user profile with role (properly normalized from snake_case)
  const profile = await getProfile(supabase, session.user.id);

  if (!profile) {
    // Create a default profile object if not found (shouldn't happen with trigger)
    const defaultProfile = createDefaultProfile(
      session.user.id,
      session.user.user_metadata?.display_name ||
        session.user.email?.split('@')[0] ||
        'User'
    );
    return (
      <DashboardLayout profile={defaultProfile}>{children}</DashboardLayout>
    );
  }

  return <DashboardLayout profile={profile}>{children}</DashboardLayout>;
}
