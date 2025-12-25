'use client';

import { useMemo, useCallback, memo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { TableEmptyState, ConfirmDialog, useToast, useFormState, useModal } from '@/modules/shared';
import { getUserColumns } from '../config/columns';
import { ResetPasswordModal } from './reset-password-modal';
import { EditUserModal } from './edit-user-modal';
import { deleteUser } from '../lib/actions';
import type { UserProfile } from '../types';
import { TOAST } from '@/lib/constants';

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
  const resetPasswordModal = useModal<{ id: string; name: string }>();
  const editUserModal = useModal<UserProfile>();
  const deleteModal = useModal<{ id: string; name: string }>();
  const { isPending, startTransition } = useFormState();

  const handleResetPassword = useCallback(
    (userId: string, userName: string) => {
      resetPasswordModal.open({ id: userId, name: userName });
    },
    [resetPasswordModal]
  );

  const handleEditUser = useCallback((user: UserProfile) => {
    editUserModal.open(user);
  }, [editUserModal]);

  const handleDeleteUser = useCallback((userId: string, userName: string) => {
    deleteModal.open({ id: userId, name: userName });
  }, [deleteModal]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteModal.data || isPending) return;

    const idToDelete = deleteModal.data.id;
    deleteModal.close();

    startTransition(async () => {
      try {
        const result = await deleteUser(idToDelete);
        if (result.success) {
          toast.success(TOAST.USER_DELETED);
          router.refresh();
        } else {
          toast.error(result.error || TOAST.ERROR_DELETE);
        }
      } catch {
        toast.error(TOAST.GENERIC_ERROR);
      }
    });
  }, [deleteModal, isPending, startTransition, toast, router]);

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
      {resetPasswordModal.data && (
        <ResetPasswordModal
          isOpen={resetPasswordModal.isOpen}
          onClose={resetPasswordModal.close}
          userId={resetPasswordModal.data.id}
          userName={resetPasswordModal.data.name}
        />
      )}

      {/* Edit User Modal */}
      {editUserModal.data && (
        <EditUserModal
          isOpen={editUserModal.isOpen}
          onClose={editUserModal.close}
          user={editUserModal.data}
          isSelf={editUserModal.data.id === currentUserId}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDeleteConfirm}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${deleteModal.data?.name}" ? Cette action est irréversible et supprimera définitivement le compte.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        isPending={isPending}
      />
    </>
  );
});
