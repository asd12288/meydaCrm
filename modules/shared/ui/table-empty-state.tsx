'use client';

export interface TableEmptyStateProps {
  /** Number of columns to span */
  colSpan: number;
  /** Message to display */
  message: string;
  /** Optional additional className */
  className?: string;
}

/**
 * Reusable table empty state component
 * Standardizes empty state rendering across tables
 */
export function TableEmptyState({
  colSpan,
  message,
  className = '',
}: TableEmptyStateProps) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className={`px-4 py-12 text-center text-darklink ${className}`}
      >
        {message}
      </td>
    </tr>
  );
}
