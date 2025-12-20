import { CardBox, PageHeader } from '@/modules/shared';
import { UsersFiltersSkeleton, UsersTableSkeleton, UsersPaginationSkeleton } from '@/modules/users';

export default function UsersLoading() {
  return (
    <div className="min-w-0">
      <PageHeader
        title="Gestion des utilisateurs"
        description="Créez et gérez les utilisateurs du CRM"
        actions={
          <div className="skeleton w-44 h-10 rounded-full" />
        }
      />

      <CardBox>
        <UsersFiltersSkeleton />
        <UsersTableSkeleton />
        <UsersPaginationSkeleton />
      </CardBox>
    </div>
  );
}
