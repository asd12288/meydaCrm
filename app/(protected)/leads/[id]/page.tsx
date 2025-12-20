import { LeadDetailView } from '@/modules/leads/views/lead-detail-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Détail du lead - Pulse CRM',
};

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;

  return <LeadDetailView leadId={id} />;
}
