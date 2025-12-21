'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { TableEmptyState, ConfirmDialog, useToast } from '@/modules/shared';
import { getUserColumns } from '../config/columns';
import { ResetPasswordModal } from './reset-password-modal';
import { EditUserModal } from './edit-user-modal';
import { deleteUser } from '../lib/actions';
import type { UserProfile } from '../types';

interface UsersTableProps {
  users: UserProfile[];
  currentUserId: string;
}

/**
 * UsersTable component with memoization
 * Optimized: Wrapped with React.memo to prevent unnecessary re-renders
 * when parent state changes but users/currentUserId props remain the same
 */
export const UsersTable = memo(function UsersTable({ users, currentUserId }: UsersTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [resetPasswordUser, setResetPasswordUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [deleteUserData, setDeleteUserData] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isPending, setIsPending] = useState(false);

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

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteUserData || isPending) return;

    const idToDelete = deleteUserData.id;
    setDeleteUserData(null); // Close dialog immediately
    setIsPending(true);

    try {
      const result = await deleteUser(idToDelete);
      if (result.success) {
        toast.success('Utilisateur supprimé');
        router.refresh();
      } else {
        toast.error(result.error || 'Erreur lors de la suppression');
      }
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setIsPending(false);
    }
  }, [deleteUserData, isPending, toast, router]);

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
});
