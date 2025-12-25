import { Suspense } from 'react';
import { requireAdmin } from '@/modules/auth';
import { PageHeader } from '@/modules/shared';
import { ImportWizardV2, ImportWizardV2Skeleton } from '@/modules/import-v2';
import { getSalesUsers } from '@/modules/leads';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Import - Pulse CRM',
};

export default async function ImportV2Page() {
  await requireAdmin();
  const salesUsers = await getSalesUsers();

  return (
    <div>
      <PageHeader
        title="Import de leads"
        description="Nouveau système d'import avec aperçu détaillé"
      />

      <Suspense fallback={<ImportWizardV2Skeleton />}>
        <ImportWizardV2 salesUsers={salesUsers} />
      </Suspense>
    </div>
  );
}
