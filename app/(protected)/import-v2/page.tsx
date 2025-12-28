import { requireAdmin } from '@/modules/auth';
import { PageHeader } from '@/modules/shared';
import { ImportDashboardV2View, getPaginatedImportJobsV2 } from '@/modules/import-v2';
import { getSalesUsers } from '@/modules/leads';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Import - Pulse CRM',
};

export default async function ImportV2Page() {
  await requireAdmin();

  // Fetch data in parallel
  const [salesUsers, historyResult] = await Promise.all([
    getSalesUsers(),
    getPaginatedImportJobsV2(1, 10),
  ]);

  const initialJobs = historyResult.success && historyResult.data ? historyResult.data.jobs : [];
  const initialTotal = historyResult.success && historyResult.data ? historyResult.data.total : 0;

  return (
    <div>
      <PageHeader
        title="Import de leads"
        description="Nouveau système d'import avec aperçu détaillé"
      />

      <ImportDashboardV2View
        salesUsers={salesUsers}
        initialJobs={initialJobs}
        initialTotal={initialTotal}
      />
    </div>
  );
}
