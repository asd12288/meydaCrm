'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/modules/auth';
import { extractValidationError } from '@/lib/validation';
import type {
  UserProfile,
  CreateUserInput,
  ResetPasswordInput,
  EditUserInput,
} from '../types';
import { createUserSchema, resetPasswordSchema, editUserSchema } from '../types';

/**
 * Get all users with their profiles and auth data (last_sign_in_at)
 * Admin only - requireAdmin() enforces this
 */
export async function getUsers(): Promise<UserProfile[]> {
  await requireAdmin();
  const supabase = await createClient();

  // Use the database function that joins profiles with auth.users
  const { data, error } = await supabase.rpc('get_users_with_auth');

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return (data as UserProfile[]) || [];
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
