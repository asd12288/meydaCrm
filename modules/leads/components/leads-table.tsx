'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { getLeadColumns } from '../config/columns';
import { BulkActionsBar } from './bulk-actions-bar';
import type { LeadWithAssignee, SalesUser } from '../types';

interface LeadsTableProps {
  leads: LeadWithAssignee[];
  isAdmin: boolean;
  salesUsers: SalesUser[];
}

export function LeadsTable({ leads, isAdmin, salesUsers }: LeadsTableProps) {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const columns = useMemo(
    () =>
      getLeadColumns({
        isAdmin,
        includeSelection: isAdmin,
      }),
    [isAdmin]
  );

  const table = useReactTable({
    data: leads,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: isAdmin,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
    getRowId: (row) => row.id,
  });

  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection).filter((id) => rowSelection[id]);
  }, [rowSelection]);

  const clearSelection = () => {
    setRowSelection({});
  };

  return (
    <>
      {/* Table container with sticky header support */}
      <div className="border rounded-md border-ld overflow-x-auto max-h-[calc(100vh-320px)]">
        <table className="w-full table-auto">
          <thead className="bg-lightgray dark:bg-darkgray sticky top-0 z-10 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2.5 text-left text-xs font-semibold text-darklink uppercase tracking-wider border-b border-ld"
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
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-12 text-center text-darklink"
                >
                  Aucun lead trouve
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-ld last:border-b-0 hover:bg-lighthover dark:hover:bg-darkgray transition-colors ${
                    row.getIsSelected() ? 'bg-lightprimary dark:bg-darkborder' : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-3 py-2.5 whitespace-nowrap text-sm"
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

      {/* Floating bulk actions bar (admin only, shows when rows selected) */}
      {isAdmin && selectedIds.length > 0 && (
        <BulkActionsBar
          selectedIds={selectedIds}
          salesUsers={salesUsers}
          onClearSelection={clearSelection}
        />
      )}
    </>
  );
}
