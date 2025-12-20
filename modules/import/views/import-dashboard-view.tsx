'use client';

import { useState, useCallback } from 'react';
import { ActiveImportsPanel } from '../components/active-imports-panel';
import { RecentHistoryCard } from '../components/recent-history-card';
import { ImportWizardCard } from '../components/import-wizard-card';
import type { SalesUser } from '@/modules/leads/types';
import type { ImportJobWithStats } from '../types';

interface ImportDashboardViewProps {
  salesUsers: SalesUser[];
  initialJobs: ImportJobWithStats[];
  initialTotal: number;
  resumeJobId?: string;
}

/**
 * Import Dashboard View
 * Shows active imports, recent history, and a collapsible import wizard
 */
export function ImportDashboardView({
  salesUsers,
  initialJobs,
  initialTotal,
  resumeJobId,
}: ImportDashboardViewProps) {
  // Show wizard automatically if resuming
  const [showWizard, setShowWizard] = useState(!!resumeJobId);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNewImport = useCallback(() => {
    setShowWizard(true);
  }, []);

  const handleWizardClose = useCallback(() => {
    setShowWizard(false);
  }, []);

  const handleImportComplete = useCallback(() => {
    // Refresh history when import completes
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-6">
      {/* Active imports monitoring panel */}
      <ActiveImportsPanel />

      {/* Recent history with new import button */}
      <RecentHistoryCard
        key={refreshKey}
        initialJobs={initialJobs}
        initialTotal={initialTotal}
        onNewImport={handleNewImport}
      />

      {/* Collapsible wizard */}
      {showWizard && (
        <ImportWizardCard
          salesUsers={salesUsers}
          resumeJobId={resumeJobId}
          onClose={handleWizardClose}
          onComplete={handleImportComplete}
        />
      )}
    </div>
  );
}
