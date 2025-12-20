'use client';

export interface TableSkeletonProps {
  /** Array of width classes for header columns (e.g., ['w-32', 'w-28', 'w-24']) */
  headerColumns: string[];
  /** Number of skeleton rows to render */
  rowCount: number;
  /** Array of className strings for each row cell (e.g., ['skeleton skeleton-text w-40', 'skeleton w-24 h-6 rounded-full']) */
  rowColumns: string[];
  /** Optional gap between header columns */
  headerGap?: string;
}

/**
 * Reusable table skeleton component
 * Standardizes skeleton loading state for tables across the application
 */
export function TableSkeleton({
  headerColumns,
  rowCount,
  rowColumns,
  headerGap = 'gap-4',
}: TableSkeletonProps) {
  const skeletonRows = Array.from({ length: rowCount }, (_, i) => i);

  return (
    <div className="border rounded-md border-ld overflow-hidden">
      {/* Header skeleton */}
      <div className="bg-lightgray dark:bg-darkgray px-4 py-3 border-b border-ld">
        <div className={`flex ${headerGap}`}>
          {headerColumns.map((width, index) => (
            <div key={index} className={`skeleton skeleton-text ${width}`} />
          ))}
        </div>
      </div>

      {/* Body skeleton rows */}
      <div className="bg-white dark:bg-dark">
        {skeletonRows.map((row) => (
          <div key={row} className="skeleton-row">
            {rowColumns.map((className, index) => (
              <div key={index} className={className} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
