'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AuthUser } from '../types';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  // Convert username to email format (username@crm.local)
  const email = `${username.toLowerCase().replace(/\s+/g, '.')}@crm.local`;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Identifiant ou mot de passe incorrect' };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email!,
    profile,
  };
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.profile?.role !== 'admin') {
    redirect('/dashboard');
  }
  return user;
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient();

  const newPassword = formData.get('newPassword') as string;

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: 'Erreur lors du changement de mot de passe' };
  }

  return { success: true };
}
