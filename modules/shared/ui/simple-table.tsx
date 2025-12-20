'use client';

import React from 'react';

export interface SimpleTableColumn<T = Record<string, unknown>> {
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface SimpleTableProps<T = Record<string, unknown>> {
  /** Table columns configuration */
  columns: SimpleTableColumn<T>[];
  /** Table data rows */
  data: T[];
  /** Optional empty state message */
  emptyMessage?: string;
  /** Optional table className */
  className?: string;
  /** Optional row key function */
  getRowKey?: (row: T, index: number) => string;
  /** Optional row className function */
  getRowClassName?: (row: T, index: number) => string;
}

/**
 * Universal simple table component
 * Uses native HTML tables with consistent styling matching the template
 * Perfect for simple data tables in dashboards and widgets
 */
export function SimpleTable({
  columns,
  data,
  emptyMessage = 'Aucune donnée',
  className = '',
  getRowKey = (_, index) => `row-${index}`,
  getRowClassName = () => '',
}: SimpleTableProps) {
  if (data.length === 0) {
    return (
      <div className={`overflow-x-auto ${className}`}>
        <table className="w-full table-auto">
          <thead className="bg-lightgray dark:bg-darkgray">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-4 py-3 text-left text-xs font-semibold text-darklink uppercase tracking-wider border-b border-ld ${column.headerClassName || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark">
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-darklink">
                {emptyMessage}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full table-auto">
        <thead className="bg-lightgray dark:bg-darkgray">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={`px-4 py-3 text-left text-xs font-semibold text-darklink uppercase tracking-wider border-b border-ld ${column.headerClassName || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-dark divide-y divide-border dark:divide-darkborder">
          {data.map((row, rowIndex) => (
            <tr
              key={getRowKey(row, rowIndex)}
              className={`hover:bg-lighthover dark:hover:bg-darkgray transition-colors ${getRowClassName(row, rowIndex)}`}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={`px-4 py-3 text-sm text-ld ${column.className || ''}`}
                >
                  {column.cell(row, rowIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
