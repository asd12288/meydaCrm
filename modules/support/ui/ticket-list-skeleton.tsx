'use client';

interface TicketListSkeletonProps {
  count?: number;
}

/**
 * Skeleton loader for ticket list items
 * Matches the exact layout of TicketListItem
 */
export function TicketListSkeleton({ count = 6 }: TicketListSkeletonProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search header skeleton */}
      <div className="shrink-0 p-4 border-b border-ld bg-white dark:bg-dark">
        <div className="skeleton h-10 w-full rounded-lg" />
      </div>

      {/* Ticket items skeleton */}
      <div className="flex-1 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <TicketItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Single ticket item skeleton
 */
function TicketItemSkeleton() {
  return (
    <div className="p-4 border-b border-ld animate-pulse">
      {/* Top row: Category badge + Time */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="skeleton h-5 w-24 rounded-full" />
        <div className="skeleton h-3 w-14 rounded" />
      </div>

      {/* Subject */}
      <div className="skeleton h-4 w-3/4 rounded mb-3" />

      {/* Bottom row: Status + Comments */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="skeleton h-2 w-2 rounded-full" />
          <div className="skeleton h-3 w-16 rounded" />
        </div>
        <div className="skeleton h-3 w-8 rounded" />
      </div>
    </div>
  );
}


