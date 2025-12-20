import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/modules/shared';
import { getSalesUsers } from '@/modules/leads';
import { ImportWizardView } from '@/modules/import/views/import-wizard-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Import - Meyda',
};

export default async function ImportPage() {
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

  // Fetch sales users for assignment dropdown
  const salesUsers = await getSalesUsers();

  return (
    <div>
      <PageHeader
        title="Import de leads"
        description="Importez des leads depuis un fichier CSV ou Excel"
      />

      <ImportWizardView salesUsers={salesUsers} />
    </div>
  );
}
