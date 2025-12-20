import { requireAdmin } from '@/modules/auth';
import { UsersListView } from '@/modules/users';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Utilisateurs - Meyda',
};

export default async function UsersPage() {
  await requireAdmin();

  return <UsersListView />;
}
