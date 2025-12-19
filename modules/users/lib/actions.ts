'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/modules/auth';
import type { UserProfile, CreateUserInput, ResetPasswordInput } from '../types';
import { createUserSchema, resetPasswordSchema } from '../types';

/**
 * Get all users with their profiles
 * Admin only - requireAdmin() enforces this
 */
export async function getUsers(): Promise<UserProfile[]> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, display_name, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return data || [];
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
    const firstError = validationResult.error.issues[0];
    return { error: firstError?.message || 'Donnees invalides' };
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
    const firstError = validationResult.error.issues[0];
    return { error: firstError?.message || 'Donnees invalides' };
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
