'use client';

import { IconUserPlus } from '@tabler/icons-react';
import { CardBox, PageHeader, ErrorBoundary, SectionErrorFallback, useModal } from '@/modules/shared';
import { Button } from '@/modules/shared';
import { UsersTable } from '../components/users-table';
import { CreateUserModal } from '../components/create-user-modal';
import { UserFilters } from '../ui/user-filters';
import { UsersPagination } from '../ui/users-pagination';
import type { UserProfile } from '../types';

interface UsersListClientProps {
  users: UserProfile[];
  currentUserId: string;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function UsersListClient({
  users,
  currentUserId,
  total,
  page,
  pageSize,
  totalPages,
}: UsersListClientProps) {
  const createModal = useModal();

  return (
    <div className="min-w-0">
      <PageHeader
        title="Gestion des utilisateurs"
        description="Créez et gérez les utilisateurs du CRM"
        actions={
          <Button
            variant="primary"
            onClick={() => createModal.open()}
          >
            <IconUserPlus size={18} />
            Créer un utilisateur
          </Button>
        }
      />

      <CardBox>
        {/* Filters */}
        <UserFilters />

        {/* Table */}
        <ErrorBoundary FallbackComponent={SectionErrorFallback}>
          <UsersTable users={users} currentUserId={currentUserId} />
        </ErrorBoundary>

        {/* Pagination */}
        <UsersPagination
          total={total}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
        />
      </CardBox>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={createModal.isOpen}
        onClose={createModal.close}
      />
    </div>
  );
}
