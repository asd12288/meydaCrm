'use client';

import { CardBox } from '@/modules/shared';
import { ImportWizardV2 } from '../components/import-wizard-v2';
import type { SalesUser } from '@/modules/leads/types';

interface ImportWizardViewProps {
  salesUsers: SalesUser[];
}

export function ImportWizardView({ salesUsers }: ImportWizardViewProps) {
  const handleImportComplete = (importJobId: string) => {
    console.log('Import completed:', importJobId);
    // Could show toast notification or redirect
  };

  return (
    <CardBox>
      <h3 className="text-lg font-semibold text-ld mb-6">Nouvel import</h3>
      <ImportWizardV2
        salesUsers={salesUsers}
        onImportComplete={handleImportComplete}
      />
    </CardBox>
  );
}
