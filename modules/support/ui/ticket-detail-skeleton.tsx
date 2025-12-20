'use client';

/**
 * Skeleton loader for ticket detail panel
 * Matches the exact layout of TicketDetailPanel
 */
export function TicketDetailSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-hidden animate-pulse">
      {/* Header skeleton */}
      <div className="shrink-0 p-4 border-b border-ld">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <div className="skeleton h-5 w-2/3 rounded mb-2" />
            {/* Meta info */}
            <div className="flex items-center gap-2">
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-1 w-1 rounded-full" />
              <div className="skeleton h-2 w-2 rounded-full" />
              <div className="skeleton h-3 w-16 rounded" />
              <div className="skeleton h-1 w-1 rounded-full" />
              <div className="skeleton h-3 w-14 rounded" />
            </div>
          </div>
          {/* Status dropdown skeleton */}
          <div className="skeleton h-10 w-32 rounded-md shrink-0" />
        </div>
      </div>

      {/* Conversation skeleton */}
      <div className="flex-1 min-h-0 overflow-hidden p-5 space-y-6">
        {/* Message 1 - from other user */}
        <MessageBubbleSkeleton isCurrentUser={false} />
        
        {/* Message 2 - from current user */}
        <MessageBubbleSkeleton isCurrentUser={true} />
        
        {/* Message 3 - from other user */}
        <MessageBubbleSkeleton isCurrentUser={false} />
      </div>

      {/* Reply input skeleton */}
      <div className="shrink-0 p-4 border-t border-ld bg-white dark:bg-dark">
        <div className="flex gap-3 items-end">
          <div className="skeleton h-11 flex-1 rounded-full" />
          <div className="skeleton h-10 w-10 rounded-full shrink-0" />
        </div>
      </div>
    </div>
  );
}

/**
 * Single message bubble skeleton
 */
function MessageBubbleSkeleton({ isCurrentUser }: { isCurrentUser: boolean }) {
  return (
    <div className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="skeleton h-10 w-10 rounded-full shrink-0" />
      
      {/* Message content */}
      <div className={`max-w-[75%] ${isCurrentUser ? 'items-end' : ''}`}>
        {/* Header: name + time */}
        <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-3 w-12 rounded" />
        </div>
        
        {/* Message body */}
        <div 
          className={`skeleton rounded-2xl ${isCurrentUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
          style={{ 
            width: isCurrentUser ? '180px' : '240px',
            height: isCurrentUser ? '48px' : '72px'
          }}
        />
      </div>
    </div>
  );
}

/**
 * Empty state skeleton (shown when no ticket is selected)
 */
export function TicketEmptyStateSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-lightgray dark:bg-darkgray animate-pulse">
      <div className="skeleton h-12 w-12 rounded-full mb-4" />
      <div className="skeleton h-4 w-40 rounded mb-2" />
      <div className="skeleton h-3 w-56 rounded" />
    </div>
  );
}
