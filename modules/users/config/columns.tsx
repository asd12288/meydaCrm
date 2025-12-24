'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { IconDots, IconKey, IconEdit, IconTrash } from '@tabler/icons-react';
import { Button } from '@/modules/shared';
import {
  UserAvatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuDivider,
} from '@/modules/shared';
import { RoleBadge } from '../ui/role-badge';
import { COLUMN_LABELS } from './constants';
import type { UserProfile } from '../types';

const columnHelper = createColumnHelper<UserProfile>();

interface ColumnOptions {
  onResetPassword: (userId: string, userName: string) => void;
  onEditUser: (user: UserProfile) => void;
  onDeleteUser?: (userId: string, userName: string) => void;
}

// Row actions dropdown component
function RowActionsDropdown({
  user,
  onResetPassword,
  onEditUser,
  onDeleteUser,
}: {
  user: UserProfile;
  onResetPassword: (userId: string, userName: string) => void;
  onEditUser: (user: UserProfile) => void;
  onDeleteUser?: (userId: string, userName: string) => void;
}) {
  return (
    <DropdownMenu
      position="bottom-right"
      widthClass="w-64"
      trigger={
        <Button variant="circleHover" size="circle">
          <IconDots size={20} />
        </Button>
      }
    >
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() => onEditUser(user)}
          icon={<IconEdit size={16} />}
        >
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onResetPassword(user.id, user.display_name)}
          icon={<IconKey size={16} />}
        >
          Réinitialiser le mot de passe
        </DropdownMenuItem>
        {onDeleteUser && (
          <>
            <DropdownMenuDivider />
            <DropdownMenuItem
              onClick={() => onDeleteUser(user.id, user.display_name)}
              icon={<IconTrash size={16} />}
              variant="danger"
            >
              Supprimer
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
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

export function getUserColumns({
  onResetPassword,
  onEditUser,
  onDeleteUser,
}: ColumnOptions) {
  return [
    // Avatar + Display name
    columnHelper.accessor('display_name', {
      header: () => COLUMN_LABELS.displayName,
      cell: (info) => (
        <div className="flex items-center gap-3">
          <UserAvatar
            name={info.getValue()}
            avatar={info.row.original.avatar}
            size="lg"
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
          onDeleteUser={onDeleteUser}
        />
      ),
      size: 60,
    }),
  ];
}
