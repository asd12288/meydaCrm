import { Suspense } from 'react';
import { requireAdminOrDeveloper } from '@/modules/auth';
import { TicketsListView } from '@/modules/support/views/tickets-list-view';
import { Spinner } from '@/modules/shared';
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

  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Spinner size="lg" /></div>}>
      <TicketsListView searchParams={searchParams} />
    </Suspense>
  );
}
