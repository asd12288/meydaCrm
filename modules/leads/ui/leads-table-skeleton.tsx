import { TableSkeleton } from '@/modules/shared';

/**
 * Skeleton loader for the leads table
 * Shows while data is loading
 */
export function LeadsTableSkeleton() {
  return (
    <TableSkeleton
      headerColumns={['w-8', 'w-32', 'w-40', 'w-24', 'w-28', 'w-24', 'w-28', 'w-24']}
      rowCount={10}
      rowColumns={[
        'skeleton skeleton-text w-4 h-4',
        'skeleton skeleton-text w-36',
        'skeleton skeleton-text w-44',
        'skeleton skeleton-text w-24',
        'skeleton skeleton-text w-28',
        'skeleton skeleton-badge',
        'skeleton skeleton-text w-24',
        'skeleton skeleton-text w-20',
        'skeleton skeleton-text w-8 h-8 rounded-full',
      ]}
      headerGap="gap-4"
    />
  );
}

/**
 * Skeleton for the filters section
 */
export function LeadsFiltersSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="skeleton w-64 h-10 rounded-md" />
      <div className="skeleton w-44 h-10 rounded-md" />
      <div className="skeleton w-48 h-10 rounded-md" />
    </div>
  );
}

/**
 * Skeleton for the pagination section
 */
export function LeadsPaginationSkeleton() {
  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-ld">
      <div className="skeleton skeleton-text w-28" />
      <div className="flex items-center gap-4">
        <div className="skeleton skeleton-text w-24" />
        <div className="skeleton w-16 h-9 rounded-md" />
        <div className="flex items-center gap-1">
          <div className="skeleton w-9 h-9 rounded-full" />
          <div className="skeleton w-9 h-9 rounded-full" />
          <div className="skeleton w-9 h-9 rounded-full" />
          <div className="skeleton w-9 h-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Full page skeleton combining all parts
 */
export function LeadsPageSkeleton() {
  return (
    <div>
      <LeadsFiltersSkeleton />
      <LeadsTableSkeleton />
      <LeadsPaginationSkeleton />
    </div>
  );
}
