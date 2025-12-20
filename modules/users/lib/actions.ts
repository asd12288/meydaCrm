'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/modules/auth';
import { extractValidationError } from '@/lib/validation';
import { ROLES } from '@/lib/constants/roles';
import { invalidateSalesUsersCache } from '@/lib/cache';
import type {
  UserProfile,
  CreateUserInput,
  ResetPasswordInput,
  EditUserInput,
  UserFilters,
  PaginatedUsersResponse,
} from '../types';
import { createUserSchema, resetPasswordSchema, editUserSchema } from '../types';

/**
 * Get paginated users with their profiles and auth data (last_sign_in_at)
 * Admin only - requireAdmin() enforces this
 * Excludes developer role (developers are only for support tickets, not team members)
 * Supports server-side filtering and pagination
 * 
 * Note: Uses RPC function to get auth data, then applies filters in memory.
 * This is acceptable since user count is typically small (dozens, not thousands).
 */
export async function getUsers(
  filters?: UserFilters
): Promise<PaginatedUsersResponse> {
  await requireAdmin();
  const supabase = await createClient();

  // Get all users with auth data via RPC function
  const { data: allUsers, error: rpcError } = await supabase.rpc('get_users_with_auth');

  if (rpcError) {
    console.error('Error fetching users with auth data:', rpcError);
    return {
      users: [],
      total: 0,
      page: filters?.page || 1,
      pageSize: filters?.pageSize || 20,
      totalPages: 0,
    };
  }

  // Filter out developers
  let filteredUsers = ((allUsers as UserProfile[]) || []).filter(
    (user) => user.role !== ROLES.DEVELOPER
  );

  // Apply search filter
  if (filters?.search && filters.search.trim().length > 0) {
    const searchLower = filters.search.trim().toLowerCase();
    filteredUsers = filteredUsers.filter(
      (user) =>
        user.display_name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
    );
  }

  // Apply role filter
  if (filters?.role) {
    filteredUsers = filteredUsers.filter((user) => user.role === filters.role);
  }

  // Apply sorting
  const sortColumn = filters?.sortBy || 'created_at';
  const ascending = filters?.sortOrder === 'asc';
  filteredUsers.sort((a, b) => {
    const aVal = a[sortColumn as keyof UserProfile];
    const bVal = b[sortColumn as keyof UserProfile];
    
    // Handle null/undefined values
    if (aVal === null || aVal === undefined) return ascending ? 1 : -1;
    if (bVal === null || bVal === undefined) return ascending ? -1 : 1;
    
    // Compare values
    if (aVal < bVal) return ascending ? -1 : 1;
    if (aVal > bVal) return ascending ? 1 : -1;
    return 0;
  });

  // Calculate pagination
  const pageSize = filters?.pageSize || 20;
  const page = filters?.page || 1;
  const total = filteredUsers.length;
  const totalPages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize;
  const to = from + pageSize;

  // Apply pagination
  const paginatedUsers = filteredUsers.slice(from, to);

  return {
    users: paginatedUsers,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Update user profile (display_name and role)
 * Admin only
 * Note: Admins cannot change their own role (safety feature)
 */
export async function updateUser(
  userId: string,
  input: EditUserInput
): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  // Validate input
  const validationResult = editUserSchema.safeParse(input);
  if (!validationResult.success) {
    return { error: extractValidationError(validationResult) };
  }

  // Get current user to check if trying to change own role
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    return { error: 'Session expiree' };
  }

  // Prevent admin from changing their own role
  if (userId === currentUser.id) {
    // Get current role
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    if (currentProfile && currentProfile.role !== input.role) {
      return { error: 'Vous ne pouvez pas modifier votre propre role' };
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: input.displayName,
      role: input.role,
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user:', error);
    return { error: 'Erreur lors de la mise a jour' };
  }

  revalidatePath('/users');
  
  // Invalidate sales users cache (user info changed)
  await invalidateSalesUsersCache();
  
  return { success: true };
}

/**
 * Create a new user via Edge Function
 * Admin only
 */
export async function createUser(
  input: CreateUserInput
): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  // Validate input
  const validationResult = createUserSchema.safeParse(input);
  if (!validationResult.success) {
    return { error: extractValidationError(validationResult) };
  }

  // Get current session for auth header
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return { error: 'Session expiree' };
  }

  try {
    // Call Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-create-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          username: input.username,
          password: input.password,
          displayName: input.displayName,
          role: input.role,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || 'Erreur lors de la creation' };
    }

    revalidatePath('/users');
    
    // Invalidate sales users cache (new user added)
    await invalidateSalesUsersCache();
    
    return { success: true };
  } catch (error) {
    console.error('Error creating user:', error);
    return { error: 'Erreur lors de la creation' };
  }
}

/**
 * Reset user password via Edge Function
 * Admin only
 */
export async function resetPassword(
  userId: string,
  input: ResetPasswordInput
): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  // Validate input
  const validationResult = resetPasswordSchema.safeParse(input);
  if (!validationResult.success) {
    return { error: extractValidationError(validationResult) };
  }

  // Get current session for auth header
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return { error: 'Session expiree' };
  }

  try {
    // Call Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-reset-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          newPassword: input.newPassword,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || 'Erreur lors de la reinitialisation' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { error: 'Erreur lors de la reinitialisation' };
  }
}

/**
 * Delete a user via Edge Function
 * Admin only
 * Prevents admin from deleting themselves
 */
export async function deleteUser(
  userId: string
): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  // Get current user to prevent self-deletion
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    return { error: 'Session expiree' };
  }

  // Prevent admin from deleting themselves
  if (currentUser.id === userId) {
    return { error: 'Vous ne pouvez pas supprimer votre propre compte' };
  }

  // Get current session for auth header
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return { error: 'Session expiree' };
  }

  try {
    // Call Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-delete-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
        }),
      }
    );

    // Try to parse JSON response
    let result;
    try {
      result = await response.json();
    } catch {
      // If response is not JSON, get text
      const text = await response.text();
      console.error('Edge Function response (not JSON):', text);
      return { error: `Erreur serveur: ${response.status} ${response.statusText}` };
    }

    if (!response.ok) {
      console.error('Edge Function error:', {
        status: response.status,
        statusText: response.statusText,
        error: result.error,
        fullResponse: result,
      });
      return { error: result.error || `Erreur lors de la suppression (${response.status})` };
    }

    revalidatePath('/users');
    
    // Invalidate sales users cache (user removed)
    await invalidateSalesUsersCache();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return { error: `Erreur lors de la suppression: ${errorMessage}` };
  }
}
