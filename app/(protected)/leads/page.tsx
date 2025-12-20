import { LeadsListView } from '@/modules/leads';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leads - Pulse CRM',
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function LeadsPage({ searchParams }: PageProps) {
  return <LeadsListView searchParams={searchParams} />;
}
