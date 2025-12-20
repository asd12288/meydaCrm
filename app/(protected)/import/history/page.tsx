import { requireAdmin } from '@/modules/auth';
import { PageHeader } from '@/modules/shared';
import { ImportHistoryView } from '@/modules/import/views/import-history-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Historique des imports - Meyda',
};

export default async function ImportHistoryPage() {
  await requireAdmin();

  return (
    <div>
      <PageHeader
        title="Historique des imports"
        description="Consultez les imports passés et gérez les erreurs"
      />

      <ImportHistoryView />
    </div>
  );
}
