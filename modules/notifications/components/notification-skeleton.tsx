'use client';

/**
 * Skeleton loader for notification items
 * Matches the structure of NotificationItem component
 */
export function NotificationSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3">
      {/* Icon skeleton */}
      <div className="shrink-0 mt-0.5">
        <div className="w-5 h-5 rounded skeleton" />
      </div>

      {/* Content skeleton */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Title skeleton with badge */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="h-4 w-3/4 skeleton skeleton-text rounded" />
          <div className="shrink-0 w-2 h-2 rounded-full skeleton" />
        </div>

        {/* Message skeleton (2 lines) */}
        <div className="space-y-1.5 mb-1.5">
          <div className="h-3.5 w-full skeleton skeleton-text rounded" />
          <div className="h-3.5 w-5/6 skeleton skeleton-text rounded" />
        </div>

        {/* Timestamp skeleton */}
        <div className="h-3 w-20 skeleton skeleton-text rounded" />
      </div>
    </div>
  );
}

/**
 * Multiple notification skeletons
 */
export function NotificationSkeletons({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <NotificationSkeleton key={i} />
      ))}
    </>
  );
}
