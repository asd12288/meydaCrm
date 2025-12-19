/**
 * Skeleton loader for the leads table
 * Shows while data is loading
 */
export function LeadsTableSkeleton() {
  // Generate 10 skeleton rows
  const skeletonRows = Array.from({ length: 10 }, (_, i) => i);

  return (
    <div className="border rounded-md border-ld overflow-hidden">
      {/* Header skeleton */}
      <div className="bg-lightgray dark:bg-darkgray px-4 py-3 border-b border-ld">
        <div className="flex gap-4">
          <div className="skeleton skeleton-text w-8" />
          <div className="skeleton skeleton-text w-32" />
          <div className="skeleton skeleton-text w-40" />
          <div className="skeleton skeleton-text w-24" />
          <div className="skeleton skeleton-text w-28" />
          <div className="skeleton skeleton-text w-24" />
          <div className="skeleton skeleton-text w-28" />
          <div className="skeleton skeleton-text w-24" />
        </div>
      </div>

      {/* Body skeleton rows */}
      <div className="bg-white dark:bg-dark">
        {skeletonRows.map((row) => (
          <div key={row} className="skeleton-row">
            <div className="skeleton skeleton-text w-4 h-4" />
            <div className="skeleton skeleton-text w-36" />
            <div className="skeleton skeleton-text w-44" />
            <div className="skeleton skeleton-text w-24" />
            <div className="skeleton skeleton-text w-28" />
            <div className="skeleton skeleton-badge" />
            <div className="skeleton skeleton-text w-24" />
            <div className="skeleton skeleton-text w-20" />
            <div className="skeleton skeleton-text w-8 h-8 rounded-full" />
          </div>
        ))}
      </div>
    </div>
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
