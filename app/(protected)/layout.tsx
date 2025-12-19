import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardLayout } from '@/modules/layout';
import type { Profile } from '@/db/types';

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

  // Fetch user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    // Create a default profile object if not found (shouldn't happen with trigger)
    const defaultProfile: Profile = {
      id: session.user.id,
      role: 'sales',
      displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return <DashboardLayout profile={defaultProfile}>{children}</DashboardLayout>;
  }

  return <DashboardLayout profile={profile}>{children}</DashboardLayout>;
}
