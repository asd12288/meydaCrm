import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CardBox, PageHeader } from '@/modules/shared';
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

  return (
    <div>
      <PageHeader
        title="Import de leads"
        description="Importez des leads depuis un fichier CSV ou Excel"
      />

      <CardBox>
        <p className="text-darklink">
          {"L'import de leads sera implemente dans les Phases 6-7."}
        </p>
      </CardBox>
    </div>
  );
}
