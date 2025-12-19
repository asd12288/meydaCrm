import { CardBox, PageHeader } from '@/modules/shared';
import { LeadsPageSkeleton } from '@/modules/leads/ui/leads-table-skeleton';

export default function LeadsLoading() {
  return (
    <div>
      <PageHeader
        title="Leads"
        description="Chargement..."
      />

      <CardBox>
        <LeadsPageSkeleton />
      </CardBox>
    </div>
  );
}
