import { CardBox, PageHeader } from '@/modules/shared';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Détail du lead - Meyda',
};

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;

  return (
    <div>
      <PageHeader
        title={`Lead #${id}`}
        description="Details du lead"
      />

      <CardBox>
        <p className="text-darklink">
          Les details du lead seront implementes dans la Phase 4.
        </p>
      </CardBox>
    </div>
  );
}
