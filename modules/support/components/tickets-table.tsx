'use client';

import { useMemo, memo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { TableEmptyState } from '@/modules/shared';
import { getTicketColumns } from '../config/columns';
import type { SupportTicketWithDetails } from '../types';

interface TicketsTableProps {
  tickets: SupportTicketWithDetails[];
  onTicketClick: (ticket: SupportTicketWithDetails) => void;
}

/**
 * TicketsTable component with memoization
 * Optimized: Wrapped with React.memo to prevent unnecessary re-renders
 * when parent state changes but tickets/onTicketClick props remain the same
 */
export const TicketsTable = memo(function TicketsTable({ tickets, onTicketClick }: TicketsTableProps) {
  const columns = useMemo(() => getTicketColumns(), []);

  const table = useReactTable({
    data: tickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <div className="border rounded-md border-ld overflow-x-auto max-h-[calc(100vh-320px)]">
      <table className="w-full table-auto">
        <thead className="bg-lightgray dark:bg-darkgray sticky top-0 z-10 shadow-sm">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-3 py-2.5 text-left text-xs font-semibold text-darklink uppercase tracking-wider border-b border-ld"
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
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <TableEmptyState
              colSpan={columns.length}
              message="Aucun ticket"
            />
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onTicketClick(row.original)}
                className="border-b border-ld last:border-0 hover:bg-hover cursor-pointer transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3 py-3 text-sm"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
});
