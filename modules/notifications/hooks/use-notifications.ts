'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount } from '../lib/actions';
import type { Notification } from '../types';

interface UseNotificationsOptions {
  /** Enable/disable fetching */
  enabled?: boolean;
  /** Page size for pagination */
  pageSize?: number;
}

interface UseNotificationsReturn {
  /** All loaded notifications */
  notifications: Notification[];
  /** Unread notification count */
  unreadCount: number;
  /** Whether more notifications are available */
  hasMore: boolean;
  /** Whether currently loading */
  isLoading: boolean;
  /** Whether loading more (pagination) */
  isLoadingMore: boolean;
  /** Error message */
  error: string | null;
  /** Load more notifications (pagination) */
  loadMore: () => void;
  /** Mark a notification as read */
  markAsRead: (notificationId: string) => Promise<void>;
  /** Mark all notifications as read */
  markAllAsRead: () => Promise<void>;
  /** Refresh notifications */
  refresh: () => Promise<void>;
}

/**
 * Hook for managing notifications with pagination
 * Fetches notifications on mount and supports infinite scroll
 * Note: Realtime removed to prevent 401 websocket errors from stale sessions
 */
export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { enabled = true, pageSize = 20 } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch initial notifications and unread count
  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch notifications and unread count in parallel
      const [notificationsResult, unreadResult] = await Promise.all([
        fetchNotifications(1, pageSize),
        getUnreadCount(),
      ]);

      if (notificationsResult.error) {
        setError(notificationsResult.error);
        return;
      }

      if (unreadResult.error) {
        console.error('Error fetching unread count:', unreadResult.error);
      }

      setNotifications(notificationsResult.data || []);
      setUnreadCount(unreadResult.count || 0);
      setHasMore(notificationsResult.hasMore || false);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // Load more notifications (pagination)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setError(null);

    try {
      const nextPage = currentPage + 1;
      const result = await fetchNotifications(nextPage, pageSize);

      if (result.error) {
        setError(result.error);
        return;
      }

      setNotifications((prev) => [...prev, ...(result.data || [])]);
      setHasMore(result.hasMore || false);
      setCurrentPage(nextPage);
    } catch (err) {
      console.error('Error loading more notifications:', err);
      setError('Erreur lors du chargement');
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, pageSize, hasMore, isLoadingMore]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      const result = await markNotificationRead(notificationId);

      if (result.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        console.error('Error marking notification as read:', result.error);
      }
    },
    []
  );

  // Mark all notifications as read (optimistic - clears immediately)
  const markAllAsRead = useCallback(async () => {
    // Optimistic update: clear count and mark as read immediately
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || now })));
    setUnreadCount(0);

    // Then persist to server in background
    const result = await markAllNotificationsRead();
    if (!result.success) {
      console.error('Error marking all as read:', result.error);
      // Could revert here, but for notifications it's not critical
    }
  }, []);

  // Refresh notifications
  const refresh = useCallback(async () => {
    await fetchInitialData();
  }, [fetchInitialData]);

  // Initial fetch
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    notifications,
    unreadCount,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}


