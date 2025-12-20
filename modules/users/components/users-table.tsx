'use client';

import { useState, useMemo, useCallback, useTransition } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { TableEmptyState, ConfirmDialog, FormErrorAlert } from '@/modules/shared';
import { getUserColumns } from '../config/columns';
import { ResetPasswordModal } from './reset-password-modal';
import { EditUserModal } from './edit-user-modal';
import { deleteUser } from '../lib/actions';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '../types';

interface UsersTableProps {
  users: UserProfile[];
  currentUserId: string;
}

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const router = useRouter();
  const [resetPasswordUser, setResetPasswordUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [deleteUserData, setDeleteUserData] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleResetPassword = useCallback(
    (userId: string, userName: string) => {
      setResetPasswordUser({ id: userId, name: userName });
    },
    []
  );

  const handleEditUser = useCallback((user: UserProfile) => {
    setEditUser(user);
  }, []);

  const handleDeleteUser = useCallback((userId: string, userName: string) => {
    setDeleteUserData({ id: userId, name: userName });
  }, []);

  const closeResetPasswordModal = useCallback(() => {
    setResetPasswordUser(null);
  }, []);

  const closeEditUserModal = useCallback(() => {
    setEditUser(null);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteUserData) return;

    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteUser(deleteUserData.id);
      if (result.success) {
        setDeleteUserData(null);
        router.refresh();
      } else {
        setDeleteError(result.error || 'Erreur lors de la suppression');
      }
    });
  }, [deleteUserData, router]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteUserData(null);
  }, []);

  const columns = useMemo(
    () =>
      getUserColumns({
        onResetPassword: handleResetPassword,
        onEditUser: handleEditUser,
        onDeleteUser: handleDeleteUser,
      }),
    [handleResetPassword, handleEditUser, handleDeleteUser]
  );

  // Filtering is done server-side via URL params in getUsers()
  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <>
      {/* Delete error alert */}
      {deleteError && (
        <div className="mb-4">
          <FormErrorAlert error={deleteError} />
        </div>
      )}

      {/* Table */}
      <div className="border rounded-md border-ld overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-lightgray dark:bg-darkgray">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-darklink uppercase tracking-wider border-b border-ld"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white dark:bg-dark">
            {table.getRowModel().rows.length === 0 ? (
              <TableEmptyState 
                colSpan={columns.length} 
                message="Aucun utilisateur trouvé" 
              />
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-ld last:border-b-0 hover:bg-lighthover dark:hover:bg-darkgray transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-4 whitespace-nowrap text-sm"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <ResetPasswordModal
          isOpen={true}
          onClose={closeResetPasswordModal}
          userId={resetPasswordUser.id}
          userName={resetPasswordUser.name}
        />
      )}

      {/* Edit User Modal */}
      {editUser && (
        <EditUserModal
          isOpen={true}
          onClose={closeEditUserModal}
          user={editUser}
          isSelf={editUser.id === currentUserId}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteUserData !== null}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${deleteUserData?.name}" ? Cette action est irréversible et supprimera définitivement le compte.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        isPending={isPending}
      />
    </>
  );
}
