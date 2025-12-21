import { getCurrentUser } from '@/modules/auth';
import {
  AdminDashboardStreaming,
  SalesDashboardStreaming,
} from '@/modules/dashboard';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tableau de bord - Pulse CRM',
};

/**
 * Dashboard page with Suspense streaming
 * 
 * Architecture:
 * - Page fetches only user info (fast)
 * - Each dashboard section fetches its own data independently
 * - Sections stream in as their data arrives
 * - Users see skeleton placeholders immediately, then content loads progressively
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Get user info (normalized to camelCase by getCurrentUser)
  const userName = user.profile?.displayName || 'Utilisateur';
  const userAvatar = user.profile?.avatar || null;
  const isAdmin = user.profile?.role === 'admin';

  // Render streaming dashboard based on role
  // Each section inside will fetch its own data via Suspense
  if (isAdmin) {
    return <AdminDashboardStreaming userName={userName} userAvatar={userAvatar} />;
  }

  return <SalesDashboardStreaming userName={userName} userAvatar={userAvatar} />;
}
