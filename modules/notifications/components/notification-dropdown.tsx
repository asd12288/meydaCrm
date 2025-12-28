'use client';

import { useEffect, useRef } from 'react';
import { IconBellOff } from '@tabler/icons-react';
import { EmptyState } from '@/modules/shared';
import { useNotifications } from '../hooks/use-notifications';
import { NotificationItem } from './notification-item';
import { NotificationSkeletons } from './notification-skeleton';

/**
 * Notification dropdown with infinite scroll
 * Shows all notifications with pagination and real-time updates
 * Automatically marks all notifications as read when opened
 */
export function NotificationDropdown() {
  const {
    notifications,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    markAsRead,
  } = useNotifications();

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll: observe the load more trigger
  useEffect(() => {
    if (!hasMore || isLoadingMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, isLoadingMore, isLoading, loadMore]);

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-dark rounded-xl border border-border shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-lightgray dark:bg-darkgray">
        <h3 className="text-sm font-semibold text-ld">Notifications</h3>
      </div>

      {/* Notifications List */}
      <div className="max-h-[500px] overflow-y-auto">
        {isLoading && notifications.length === 0 ? (
          // Initial loading skeleton - show 3 skeleton items
          <NotificationSkeletons count={3} />
        ) : notifications.length === 0 ? (
          // Empty state
          <EmptyState
            icon={<IconBellOff size={48} />}
            title="Aucune notification"
            description="Vous recevrez des notifications ici"
          />
        ) : (
          <>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
              />
            ))}

            {/* Load more trigger */}
            {hasMore && (
              <div ref={loadMoreRef}>
                {isLoadingMore && <NotificationSkeletons count={2} />}
              </div>
            )}

            {/* End of list */}
            {!hasMore && notifications.length > 0 && (
              <div className="px-4 py-4 text-center border-t border-border">
                <p className="text-xs text-darklink">Fin des notifications</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
