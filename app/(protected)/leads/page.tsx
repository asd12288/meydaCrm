import { CardBox, PageHeader } from '@/modules/shared';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leads - CRM Medya',
};

export default function LeadsPage() {
  return (
    <div>
      <PageHeader
        title="Leads"
        description="Gerez tous vos leads"
      />

      <CardBox>
        <p className="text-darklink">
          La liste des leads sera implementee dans la Phase 3.
        </p>
      </CardBox>
    </div>
  );
}
