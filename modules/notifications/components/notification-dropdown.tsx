'use client';

import { useEffect, useRef, useState } from 'react';
import { IconCheck, IconBellOff } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/modules/shared';
import { useNotifications } from '../hooks/use-notifications';
import { NotificationItem } from './notification-item';
import { NotificationSkeletons } from './notification-skeleton';

interface NotificationDropdownProps {
  /** @deprecated Not currently used, kept for future implementation */
  onClose?: () => void;
}

/**
 * Notification dropdown with infinite scroll
 * Shows all notifications with pagination and real-time updates
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const {
    notifications,
    unreadCount,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

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

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    await markAllAsRead();
    setIsMarkingAll(false);
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-dark rounded-xl border border-border shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-lightgray dark:bg-darkgray flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ld">Toutes les notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghostText"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll}
            className="text-xs text-primary hover:text-primary/80 font-medium"
          >
            {isMarkingAll ? (
              <>
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>En cours...</span>
              </>
            ) : (
              <>
                <IconCheck size={14} />
                <span>Marquer tout comme lu</span>
              </>
            )}
          </Button>
        )}
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
