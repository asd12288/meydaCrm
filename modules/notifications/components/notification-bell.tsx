'use client';

import { useState, useRef } from 'react';
import { IconBell } from '@tabler/icons-react';
import { useNotifications } from '../hooks/use-notifications';
import { NotificationDropdown } from './notification-dropdown';
import { useClickOutside } from '@/modules/shared/hooks/use-click-outside';

/**
 * Notification bell component with unread badge
 * Shows dropdown on click with all notifications
 */
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useNotifications({ enabled: true });

  useClickOutside(bellRef, () => setIsOpen(false), isOpen);

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-lightgray dark:hover:bg-darkgray transition-all duration-150 cursor-pointer group active:scale-95"
        aria-label="Notifications"
      >
        <IconBell 
          size={20} 
          className={`text-darklink transition-transform duration-200 group-hover:scale-110 ${unreadCount > 0 ? 'group-hover:rotate-12' : ''}`} 
        />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-xs font-semibold text-white bg-error rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && <NotificationDropdown onClose={() => setIsOpen(false)} />}
    </div>
  );
}
