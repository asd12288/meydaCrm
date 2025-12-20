'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getNotificationIcon } from '../config/constants';
import { formatRelativeTime } from '@/modules/leads/lib/format';
import type { Notification } from '../types';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (notificationId: string) => void;
}

/**
 * Individual notification item component
 * Displays icon, title, message, timestamp, and handles click to navigate
 */
export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const router = useRouter();
  const NotificationIcon = useMemo(() => getNotificationIcon(notification.type), [notification.type]);
  const isRead = !!notification.readAt;
  const timeAgo = formatRelativeTime(notification.createdAt);

  const handleClick = () => {
    // Mark as read if unread
    if (!isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    // Navigate to action URL if present
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        flex gap-3 px-4 py-3 cursor-pointer transition-colors
        ${isRead ? 'hover:bg-lightgray dark:hover:bg-darkgray' : 'bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20'}
      `}
    >
      {/* Icon */}
      <div className={`shrink-0 mt-0.5 ${isRead ? 'text-darklink' : 'text-primary'}`}>
        <NotificationIcon size={20} stroke={1.5} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4
            className={`text-sm font-semibold ${isRead ? 'text-darklink' : 'text-ld'}`}
          >
            {notification.title}
          </h4>
          {!isRead && (
            <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
          )}
        </div>

        {/* Message */}
        <p className="text-sm text-darklink line-clamp-2 mb-1.5">{notification.message}</p>

        {/* Timestamp */}
        <p className="text-xs text-darklink">{timeAgo}</p>
      </div>
    </div>
  );
}
