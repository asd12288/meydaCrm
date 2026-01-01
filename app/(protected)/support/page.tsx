import { requireAdminOrDeveloper } from '@/modules/auth';
import { TicketsListView } from '@/modules/support/views/tickets-list-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support - Pulse CRM',
  description: 'Gérez vos tickets de support',
};

interface SupportPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SupportPage({ searchParams }: SupportPageProps) {
  await requireAdminOrDeveloper();

  return <TicketsListView searchParams={searchParams} />;
}


