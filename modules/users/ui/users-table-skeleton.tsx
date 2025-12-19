export function UsersTableSkeleton() {
  const skeletonRows = Array.from({ length: 5 }, (_, i) => i);

  return (
    <div className="border rounded-md border-ld overflow-hidden">
      {/* Header skeleton */}
      <div className="bg-lightgray dark:bg-darkgray px-4 py-3 border-b border-ld">
        <div className="flex gap-8">
          <div className="skeleton skeleton-text w-32" />
          <div className="skeleton skeleton-text w-28" />
          <div className="skeleton skeleton-text w-24" />
          <div className="skeleton skeleton-text w-12" />
        </div>
      </div>

      {/* Body skeleton rows */}
      <div className="bg-white dark:bg-dark">
        {skeletonRows.map((row) => (
          <div key={row} className="skeleton-row">
            <div className="skeleton skeleton-text w-40" />
            <div className="skeleton w-24 h-6 rounded-full" />
            <div className="skeleton skeleton-text w-24" />
            <div className="skeleton w-8 h-8 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
