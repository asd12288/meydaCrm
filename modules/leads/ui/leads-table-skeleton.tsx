import { TableSkeleton } from '@/modules/shared';

/**
 * Column widths matching modules/leads/config/columns.tsx
 * selection=40, name=150, email=180, phone=120, company=130, status=155, assignee=110, updated_at=100, actions=50
 */
const LEADS_SKELETON_COLUMNS = [
  { width: 40, skeletonClass: 'skeleton-checkbox', skeletonWidth: 'w-4 h-4' }, // selection
  { width: 150, skeletonClass: 'skeleton-text', skeletonWidth: 'w-28' }, // name
  { width: 180, skeletonClass: 'skeleton-text', skeletonWidth: 'w-36' }, // email
  { width: 120, skeletonClass: 'skeleton-text', skeletonWidth: 'w-24' }, // phone
  { width: 130, skeletonClass: 'skeleton-text', skeletonWidth: 'w-20' }, // company
  { width: 155, skeletonClass: 'skeleton-badge', skeletonWidth: 'w-24 h-6 rounded-full' }, // status
  { width: 110, skeletonClass: 'skeleton-text', skeletonWidth: 'w-20' }, // assignee
  { width: 100, skeletonClass: 'skeleton-text', skeletonWidth: 'w-16' }, // updated_at
  { width: 50, skeletonClass: 'skeleton-circle', skeletonWidth: 'w-8 h-8 rounded-full' }, // actions
];

/**
 * Skeleton loader for the leads table
 * Uses exact column widths to prevent layout shift
 */
export function LeadsTableSkeleton() {
  return (
    <TableSkeleton
      columns={LEADS_SKELETON_COLUMNS}
      rowCount={10}
      cellPadding="px-3 py-2.5"
      maxHeight="max-h-[calc(100vh-320px)]"
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
