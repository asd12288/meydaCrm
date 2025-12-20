'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount } from '../lib/actions';
import type { Notification } from '../types';

interface UseNotificationsOptions {
  /** Enable/disable real-time subscription */
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
  /** Whether real-time subscription is connected */
  isConnected: boolean;
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
 * Hook for managing notifications with real-time updates via Supabase Broadcast
 * Supports infinite scroll pagination and real-time delivery
 */
export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { enabled = true, pageSize = 20 } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const supabaseRef = useRef(createClient());

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

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const result = await markAllNotificationsRead();

    if (result.success) {
      // Update local state
      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || now })));
      setUnreadCount(0);
    } else {
      console.error('Error marking all as read:', result.error);
    }
  }, []);

  // Refresh notifications
  const refresh = useCallback(async () => {
    await fetchInitialData();
  }, [fetchInitialData]);

  // Setup real-time subscription
  useEffect(() => {
    if (!enabled) return;

    const supabase = supabaseRef.current;

    // Get current user ID from session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user?.id) {
        console.warn('[Notifications] No user session, skipping real-time subscription');
        return;
      }

      const userId = session.user.id;

      // Create private channel for user-specific notifications
      const channel = supabase
        .channel(`notifications-${userId}`, {
          config: {
            private: true,
          },
        })
        .on(
          'broadcast',
          {
            event: 'INSERT', // Event type from broadcast_changes (INSERT/UPDATE/DELETE)
          },
          (payload) => {
            console.log('[Notifications] Received broadcast:', payload);

            // Broadcast payload from realtime.broadcast_changes contains the data directly
            // The structure depends on how we called broadcast_changes - NEW record is passed
            const notificationData = (payload as { new?: Record<string, unknown> }).new || payload;
            
            // Transform snake_case to camelCase if needed
            const notification: Notification = {
              id: notificationData.id,
              userId: notificationData.user_id || notificationData.userId,
              type: notificationData.type,
              title: notificationData.title,
              message: notificationData.message,
              metadata: notificationData.metadata,
              readAt: notificationData.read_at || notificationData.readAt,
              actionUrl: notificationData.action_url || notificationData.actionUrl,
              createdAt: notificationData.created_at || notificationData.createdAt,
            };

            // Add to top of list
            setNotifications((prev) => [notification, ...prev]);

            // Increment unread count
            setUnreadCount((prev) => prev + 1);

            // Refresh unread count from server (more accurate)
            getUnreadCount().then((result) => {
              if (result.success && result.count !== undefined) {
                setUnreadCount(result.count);
              }
            });
          }
        )
        .subscribe((status) => {
          console.log('[Notifications] Subscription status:', status);
          setIsConnected(status === 'SUBSCRIBED');
        });

      channelRef.current = channel;
    });

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [enabled]);

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
    isConnected,
    loadMore,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}
