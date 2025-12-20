import { CardBox, PageHeader } from '@/modules/shared';
import { UsersTableSkeleton } from '@/modules/users';

export default function UsersLoading() {
  return (
    <div className="min-w-0">
      <PageHeader
        title="Gestion des utilisateurs"
        description="Creez et gerez les utilisateurs du CRM"
      />

      <CardBox>
        <UsersTableSkeleton />
      </CardBox>
    </div>
  );
}
