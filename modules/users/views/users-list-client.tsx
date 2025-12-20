'use client';

import { useState } from 'react';
import { IconUserPlus } from '@tabler/icons-react';
import { CardBox, PageHeader } from '@/modules/shared';
import { Button } from '@/components/ui/button';
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="min-w-0">
      <PageHeader
        title="Gestion des utilisateurs"
        description="Créez et gérez les utilisateurs du CRM"
        actions={
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
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
        <UsersTable users={users} currentUserId={currentUserId} />

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
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
