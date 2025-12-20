'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { Dropdown, DropdownItem } from 'flowbite-react';
import { IconDots, IconKey, IconEdit } from '@tabler/icons-react';
import { UserAvatar } from '@/modules/shared';
import { RoleBadge } from '../ui/role-badge';
import { COLUMN_LABELS } from './constants';
import type { UserProfile } from '../types';

const columnHelper = createColumnHelper<UserProfile>();

interface ColumnOptions {
  onResetPassword: (userId: string, userName: string) => void;
  onEditUser: (user: UserProfile) => void;
}

// Row actions dropdown component
function RowActionsDropdown({
  user,
  onResetPassword,
  onEditUser,
}: {
  user: UserProfile;
  onResetPassword: (userId: string, userName: string) => void;
  onEditUser: (user: UserProfile) => void;
}) {
  return (
    <Dropdown
      label=""
      dismissOnClick
      renderTrigger={() => (
        <span className="h-9 w-9 flex justify-center items-center rounded-full hover:bg-lightprimary hover:text-primary cursor-pointer transition-colors">
          <IconDots size={20} />
        </span>
      )}
    >
      <DropdownItem
        onClick={() => onEditUser(user)}
        className="flex items-center gap-3"
      >
        <IconEdit size={16} />
        Modifier
      </DropdownItem>
      <DropdownItem
        onClick={() => onResetPassword(user.id, user.display_name)}
        className="flex items-center gap-3"
      >
        <IconKey size={16} />
        Reinitialiser le mot de passe
      </DropdownItem>
    </Dropdown>
  );
}

// Format relative time for last login
function formatLastLogin(date: string | null): string {
  if (!date) return 'Jamais';

  const now = new Date();
  const loginDate = new Date(date);
  const diffMs = now.getTime() - loginDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "A l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return loginDate.toLocaleDateString('fr-FR');
}

export function getUserColumns({ onResetPassword, onEditUser }: ColumnOptions) {
  return [
    // Avatar + Display name
    columnHelper.accessor('display_name', {
      header: () => COLUMN_LABELS.displayName,
      cell: (info) => (
        <div className="flex items-center gap-3">
          <UserAvatar
            name={info.getValue()}
            avatar={info.row.original.avatar}
            size="sm"
          />
          <span className="font-medium text-ld">{info.getValue()}</span>
        </div>
      ),
      size: 220,
    }),

    // Role badge
    columnHelper.accessor('role', {
      header: () => COLUMN_LABELS.role,
      cell: (info) => <RoleBadge role={info.getValue()} />,
      size: 130,
    }),

    // Last login
    columnHelper.accessor('last_sign_in_at', {
      header: () => COLUMN_LABELS.lastLogin,
      cell: (info) => (
        <span className="text-sm text-darklink">
          {formatLastLogin(info.getValue())}
        </span>
      ),
      size: 130,
    }),

    // Created at
    columnHelper.accessor('created_at', {
      header: () => COLUMN_LABELS.createdAt,
      cell: (info) => (
        <span className="text-sm text-darklink">
          {new Date(info.getValue()).toLocaleDateString('fr-FR')}
        </span>
      ),
      size: 120,
    }),

    // Actions dropdown
    columnHelper.display({
      id: 'actions',
      header: () => '',
      cell: (info) => (
        <RowActionsDropdown
          user={info.row.original}
          onResetPassword={onResetPassword}
          onEditUser={onEditUser}
        />
      ),
      size: 60,
    }),
  ];
}
