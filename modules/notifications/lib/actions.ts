'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/modules/auth';
import { FR_MESSAGES } from '@/lib/errors';
import type { Notification, NotificationType, NotificationMetadata } from '../types';

/**
 * Create admin Supabase client (bypasses RLS for inserting notifications)
 */
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create a notification (service role only - bypasses RLS)
 * Used internally by helper functions
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: NotificationMetadata | null,
  actionUrl?: string | null
): Promise<{ success?: boolean; error?: string; notificationId?: string }> {
  try {
    const supabaseAdmin = createAdminClient();

    // Validate user exists
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return { error: 'Utilisateur introuvable' };
    }

    // Insert notification
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        metadata: metadata || null,
        action_url: actionUrl || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return { error: 'Erreur lors de la création de la notification' };
    }

    // Broadcast is handled by database trigger
    return { success: true, notificationId: data.id };
  } catch (error) {
    console.error('Error in createNotification:', error);
    return { error: 'Erreur inattendue' };
  }
}

/**
 * Fetch paginated notifications for current user
 */
export async function fetchNotifications(
  page: number = 1,
  pageSize: number = 20
): Promise<{
  success?: boolean;
  data?: Notification[];
  error?: string;
  hasMore?: boolean;
}> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { error: FR_MESSAGES.UNAUTHENTICATED };
  }

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Fetch notifications for current user
    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching notifications:', error);
      return { error: 'Erreur lors du chargement' };
    }

    // Transform snake_case to camelCase
    const notifications: Notification[] = (data || []).map((n) => ({
      id: n.id,
      userId: n.user_id,
      type: n.type as NotificationType,
      title: n.title,
      message: n.message,
      metadata: n.metadata as NotificationMetadata | null,
      readAt: n.read_at,
      actionUrl: n.action_url,
      createdAt: n.created_at,
    }));

    const total = count || 0;
    const hasMore = to < total - 1;

    return {
      success: true,
      data: notifications,
      hasMore,
    };
  } catch (error) {
    console.error('Error in fetchNotifications:', error);
    return { error: 'Erreur inattendue' };
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(
  notificationId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { error: FR_MESSAGES.UNAUTHENTICATED };
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', user.id); // RLS ensures user can only update their own

    if (error) {
      console.error('Error marking notification as read:', error);
      return { error: 'Erreur lors de la mise à jour' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in markNotificationRead:', error);
    return { error: 'Erreur inattendue' };
  }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsRead(): Promise<{
  success?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { error: FR_MESSAGES.UNAUTHENTICATED };
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null); // Only update unread ones

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return { error: 'Erreur lors de la mise à jour' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in markAllNotificationsRead:', error);
    return { error: 'Erreur inattendue' };
  }
}

/**
 * Get unread notification count for current user
 */
export async function getUnreadCount(): Promise<{
  success?: boolean;
  count?: number;
  error?: string;
}> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { error: FR_MESSAGES.UNAUTHENTICATED };
  }

  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null);

    if (error) {
      console.error('Error getting unread count:', error);
      return { error: 'Erreur lors du chargement' };
    }

    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('Error in getUnreadCount:', error);
    return { error: 'Erreur inattendue' };
  }
}


