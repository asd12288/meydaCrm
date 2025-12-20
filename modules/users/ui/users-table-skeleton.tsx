import { TableSkeleton } from '@/modules/shared';

/**
 * Column widths matching modules/users/config/columns.tsx
 * display_name=220, role=130, last_sign_in_at=130, created_at=120, actions=60
 */
const USERS_SKELETON_COLUMNS = [
  { width: 220, skeletonClass: 'skeleton-avatar-text', skeletonWidth: 'w-40' }, // display_name with avatar
  { width: 130, skeletonClass: 'skeleton-badge', skeletonWidth: 'w-20 h-6 rounded-full' }, // role badge
  { width: 130, skeletonClass: 'skeleton-text', skeletonWidth: 'w-20' }, // last_sign_in_at
  { width: 120, skeletonClass: 'skeleton-text', skeletonWidth: 'w-20' }, // created_at
  { width: 60, skeletonClass: 'skeleton-circle', skeletonWidth: 'w-8 h-8 rounded-full' }, // actions
];

/**
 * Skeleton for the users filters section
 * Matches user-filters.tsx: search input (w-64) + role dropdown
 */
export function UsersFiltersSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* Search input skeleton - matches w-64 h-10 */}
      <div className="skeleton w-64 h-10 rounded-md" />
      {/* Role filter dropdown skeleton */}
      <div className="skeleton w-44 h-10 rounded-md" />
    </div>
  );
}

/**
 * Skeleton loader for the users table
 * Uses exact column widths to prevent layout shift
 */
export function UsersTableSkeleton() {
  return (
    <TableSkeleton
      columns={USERS_SKELETON_COLUMNS}
      rowCount={10}
      cellPadding="px-4 py-4"
    />
  );
}

/**
 * Skeleton for the pagination section
 */
export function UsersPaginationSkeleton() {
  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-ld">
      <div className="skeleton skeleton-text w-32" />
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
 * Full page skeleton combining filters + table + pagination
 */
export function UsersPageSkeleton() {
  return (
    <div>
      <UsersFiltersSkeleton />
      <UsersTableSkeleton />
      <UsersPaginationSkeleton />
    </div>
  );
}
