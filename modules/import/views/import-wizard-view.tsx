'use client';

import { CardBox } from '@/modules/shared';
import { ImportWizardV2 } from '../components/import-wizard-v2';
import { ActiveImportsPanel } from '../components/active-imports-panel';
import type { SalesUser } from '@/modules/leads/types';

interface ImportWizardViewProps {
  salesUsers: SalesUser[];
  resumeJobId?: string;
}

export function ImportWizardView({ salesUsers, resumeJobId }: ImportWizardViewProps) {
  const handleImportComplete = (importJobId: string) => {
    console.log('Import completed:', importJobId);
    // Could show toast notification or redirect
  };

  return (
    <div className="space-y-6">
      {/* Active imports monitoring panel - hide when resuming */}
      {!resumeJobId && <ActiveImportsPanel />}

      {/* Main import wizard */}
      <CardBox>
        <h3 className="text-lg font-semibold text-ld mb-6">
          {resumeJobId ? 'Reprendre l\'import' : 'Nouvel import'}
        </h3>
        <ImportWizardV2
          salesUsers={salesUsers}
          onImportComplete={handleImportComplete}
          resumeJobId={resumeJobId}
        />
      </CardBox>
    </div>
  );
}
