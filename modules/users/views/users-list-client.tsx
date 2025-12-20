'use client';

import { useState } from 'react';
import { IconUserPlus } from '@tabler/icons-react';
import { CardBox, PageHeader } from '@/modules/shared';
import { UsersTable } from '../components/users-table';
import { CreateUserModal } from '../components/create-user-modal';
import type { UserProfile } from '../types';

interface UsersListClientProps {
  users: UserProfile[];
  currentUserId: string;
}

export function UsersListClient({ users, currentUserId }: UsersListClientProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="min-w-0">
      <PageHeader
        title="Gestion des utilisateurs"
        description="Creez et gerez les utilisateurs du CRM"
        actions={
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="ui-button bg-primary text-white flex items-center gap-2"
          >
            <IconUserPlus size={18} />
            Creer un utilisateur
          </button>
        }
      />

      <CardBox>
        <UsersTable users={users} currentUserId={currentUserId} />
      </CardBox>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
