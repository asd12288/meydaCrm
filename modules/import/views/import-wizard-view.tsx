'use client';

import { CardBox } from '@/modules/shared';
import { ImportWizard } from '../components/import-wizard';
import type { SalesUser } from '@/modules/leads/types';

interface ImportWizardViewProps {
  salesUsers: SalesUser[];
}

export function ImportWizardView({ salesUsers }: ImportWizardViewProps) {
  const handleImportComplete = (importJobId: string) => {
    // TODO: Navigate to import job detail or leads list
    console.log('Import completed:', importJobId);
  };

  return (
    <CardBox>
      <ImportWizard
        salesUsers={salesUsers}
        onImportComplete={handleImportComplete}
      />
    </CardBox>
  );
}
