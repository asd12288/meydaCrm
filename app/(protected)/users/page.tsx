import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CardBox, PageHeader } from '@/modules/shared';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Utilisateurs - CRM Medya',
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

  return (
    <div>
      <PageHeader
        title="Gestion des utilisateurs"
        description="Creez et gerez les utilisateurs du CRM"
      />

      <CardBox>
        <p className="text-darklink">
          La gestion des utilisateurs sera implementee dans la Phase 5.
        </p>
      </CardBox>
    </div>
  );
}
