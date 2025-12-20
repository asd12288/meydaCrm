import { requireAdmin } from '@/modules/auth';
import { UsersListView } from '@/modules/users';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Utilisateurs - Pulse CRM',
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  await requireAdmin();

  return <UsersListView searchParams={searchParams} />;
}
