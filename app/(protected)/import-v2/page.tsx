import { Suspense } from 'react';
import { requireAdmin } from '@/modules/auth';
import { PageHeader } from '@/modules/shared';
import { ImportWizardV2, ImportWizardV2Skeleton } from '@/modules/import-v2';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Import V2 - Pulse CRM',
};

export default async function ImportV2Page() {
  await requireAdmin();

  return (
    <div>
      <PageHeader
        title="Import de leads (V2)"
        description="Nouveau systeme d'import avec apercu detaille"
      />

      <Suspense fallback={<ImportWizardV2Skeleton />}>
        <ImportWizardV2 />
      </Suspense>
    </div>
  );
}
