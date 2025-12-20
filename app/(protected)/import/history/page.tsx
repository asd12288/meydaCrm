import Link from 'next/link';
import { IconUpload } from '@tabler/icons-react';
import { requireAdmin } from '@/modules/auth';
import { PageHeader } from '@/modules/shared';
import { ImportHistoryView } from '@/modules/import/views/import-history-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Historique des imports - Pulse CRM',
};

export default async function ImportHistoryPage() {
  await requireAdmin();

  return (
    <div>
      <PageHeader
        title="Historique des imports"
        description="Consultez les imports passés et gérez les erreurs"
        actions={
          <Link
            href="/import"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primaryemphasis transition-colors"
          >
            <IconUpload className="w-4 h-4" />
            Nouvel import
          </Link>
        }
      />

      <ImportHistoryView />
    </div>
  );
}
