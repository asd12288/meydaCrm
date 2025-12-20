import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UsersListView } from '@/modules/users';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Utilisateurs - Meyda',
};

export default async function UsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Role guard: only admins can access
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  return <UsersListView />;
}
