'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { extractValidationError } from '@/lib/validation';
import { isValidAvatarId } from '@/lib/constants';
import {
  updateProfileSchema,
  changePasswordSchema,
  type AccountStats,
} from '../types';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non authentifié' };
  }

  const displayName = formData.get('displayName') as string;

  // Validate input
  const result = updateProfileSchema.safeParse({ displayName });
  if (!result.success) {
    return { error: extractValidationError(result) };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: result.data.displayName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { error: 'Erreur lors de la mise à jour du profil' };
  }

  revalidatePath('/account');
  revalidatePath('/', 'layout'); // Refresh header too
  return { success: true };
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non authentifié' };
  }

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // Validate input
  const result = changePasswordSchema.safeParse({
    currentPassword,
    newPassword,
    confirmPassword,
  });

  if (!result.success) {
    return { error: extractValidationError(result) };
  }

  // Verify current password by attempting to sign in
  const email = user.email!;
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (signInError) {
    return { error: 'Le mot de passe actuel est incorrect' };
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { error: 'Erreur lors du changement de mot de passe' };
  }

  return { success: true, message: 'Mot de passe modifié avec succès' };
}

export async function getAccountStats(): Promise<AccountStats | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get leads count and status breakdown
  // RLS automatically filters: sales users see only assigned leads, admins see all
  const { data: leads, count: totalLeads } = await supabase
    .from('leads')
    .select('status', { count: 'exact' });

  // Calculate status breakdown
  const byStatus: Record<string, number> = {};
  if (leads) {
    for (const lead of leads) {
      const status = lead.status || 'new';
      byStatus[status] = (byStatus[status] || 0) + 1;
    }
  }

  // Get comments count
  const commentsQuery = supabase
    .from('lead_comments')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', user.id);

  const { count: commentsCount } = await commentsQuery;

  // Get last activity (most recent comment or history event by this user)
  const { data: lastComment } = await supabase
    .from('lead_comments')
    .select('created_at')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const { data: lastHistory } = await supabase
    .from('lead_history')
    .select('created_at')
    .eq('actor_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let lastActivity: string | null = null;
  if (lastComment?.created_at || lastHistory?.created_at) {
    const commentDate = lastComment?.created_at
      ? new Date(lastComment.created_at)
      : new Date(0);
    const historyDate = lastHistory?.created_at
      ? new Date(lastHistory.created_at)
      : new Date(0);
    lastActivity =
      commentDate > historyDate
        ? lastComment!.created_at
        : lastHistory!.created_at;
  }

  return {
    leads: {
      total: totalLeads || 0,
      byStatus,
    },
    commentsCount: commentsCount || 0,
    lastActivity,
  };
}

export async function updateAvatar(avatarId: string | null) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non authentifié' };
  }

  // Validate avatar ID (allow null to clear avatar)
  if (avatarId !== null && !isValidAvatarId(avatarId)) {
    return { error: 'Avatar invalide' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      avatar: avatarId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { error: "Erreur lors de la mise à jour de l'avatar" };
  }

  revalidatePath('/account');
  revalidatePath('/', 'layout'); // Refresh header too
  return { success: true };
}
