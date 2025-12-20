'use client';

export interface TableSkeletonColumn {
  /** Width in pixels (matches actual column size) */
  width: number;
  /** Skeleton content class (e.g., 'skeleton-text', 'skeleton-badge') */
  skeletonClass?: string;
  /** Additional width class for the skeleton element inside the cell */
  skeletonWidth?: string;
}

export interface TableSkeletonProps {
  /** Column definitions with widths matching actual table columns */
  columns: TableSkeletonColumn[];
  /** Number of skeleton rows to render */
  rowCount: number;
  /** Cell padding class (should match actual table) */
  cellPadding?: string;
  /** Row height class (should match actual table) */
  rowHeight?: string;
  /** Max height for scrollable container */
  maxHeight?: string;
}

/**
 * Reusable table skeleton component using actual <table> structure
 * Prevents layout shift by matching exact column widths and structure
 */
export function TableSkeleton({
  columns,
  rowCount,
  cellPadding = 'px-3 py-2.5',
  rowHeight,
  maxHeight,
}: TableSkeletonProps) {
  const skeletonRows = Array.from({ length: rowCount }, (_, i) => i);

  return (
    <div 
      className={`border rounded-md border-ld overflow-auto ${maxHeight || ''}`}
    >
      <table className="w-full table-auto">
        <thead className="bg-lightgray dark:bg-darkgray sticky top-0 z-10">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                className={`${cellPadding} text-left text-xs font-semibold text-darklink uppercase tracking-wider border-b border-ld`}
                style={{ width: col.width }}
              >
                <div className={`skeleton skeleton-text ${col.skeletonWidth || 'w-16'}`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-dark">
          {skeletonRows.map((row) => (
            <tr 
              key={row} 
              className={`border-b border-ld last:border-b-0 ${rowHeight || ''}`}
            >
              {columns.map((col, colIndex) => (
                <td
                  key={colIndex}
                  className={`${cellPadding} whitespace-nowrap text-sm`}
                  style={{ width: col.width }}
                >
                  <div className={`skeleton ${col.skeletonClass || 'skeleton-text'} ${col.skeletonWidth || 'w-full'}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Legacy interface for backward compatibility during migration
export interface LegacyTableSkeletonProps {
  headerColumns: string[];
  rowCount: number;
  rowColumns: string[];
  headerGap?: string;
}

/**
 * @deprecated Use TableSkeleton with columns prop instead
 * Legacy skeleton component for backward compatibility
 */
export function LegacyTableSkeleton({
  headerColumns,
  rowCount,
  rowColumns,
  headerGap = 'gap-4',
}: LegacyTableSkeletonProps) {
  const skeletonRows = Array.from({ length: rowCount }, (_, i) => i);

  return (
    <div className="border rounded-md border-ld overflow-hidden">
      <div className="bg-lightgray dark:bg-darkgray px-4 py-3 border-b border-ld">
        <div className={`flex ${headerGap}`}>
          {headerColumns.map((width, index) => (
            <div key={index} className={`skeleton skeleton-text ${width}`} />
          ))}
        </div>
      </div>
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
