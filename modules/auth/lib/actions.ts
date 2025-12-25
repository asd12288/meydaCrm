'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { usernameSchema, extractValidationError } from '@/lib/validation';
import { loginRateLimiter } from '@/lib/rate-limit';
import { normalizeProfile, type SupabaseProfile } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import type { AuthUser } from '../types';

// Login validation schema
const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, 'Mot de passe requis'),
});

export async function login(formData: FormData) {
  // Rate limit by IP address to prevent brute force attacks
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] ??
             headersList.get('x-real-ip') ??
             'unknown';

  const { success: rateLimitOk } = await loginRateLimiter.limit(ip);
  if (!rateLimitOk) {
    return { error: 'Trop de tentatives. Réessayez dans une minute.' };
  }

  const supabase = await createClient();

  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  // Validate input to prevent injection attacks
  const validation = loginSchema.safeParse({ username, password });
  if (!validation.success) {
    return { error: extractValidationError(validation) };
  }

  // Convert validated username to email format (username@crm.local)
  const email = `${validation.data.username.toLowerCase().replace(/\s+/g, '.')}@crm.local`;

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
    email: user.email ?? '',
    profile: profile ? normalizeProfile(profile as SupabaseProfile) : null,
  };
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.profile?.role !== ROLES.ADMIN) {
    redirect('/dashboard');
  }
  return user;
}

export async function requireAdminOrDeveloper(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.profile?.role !== ROLES.ADMIN && user.profile?.role !== ROLES.DEVELOPER) {
    redirect('/dashboard');
  }
  return user;
}

export async function requireDeveloper(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.profile?.role !== ROLES.DEVELOPER) {
    redirect('/dashboard');
  }
  return user;
}
