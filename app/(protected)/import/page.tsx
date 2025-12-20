import { requireAdmin } from '@/modules/auth';
import { PageHeader } from '@/modules/shared';
import { getSalesUsers } from '@/modules/leads';
import { ImportWizardView } from '@/modules/import/views/import-wizard-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Import - Meyda',
};

export default async function ImportPage() {
  await requireAdmin();

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
