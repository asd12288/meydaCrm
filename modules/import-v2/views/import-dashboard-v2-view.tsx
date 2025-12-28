/**
 * Import Dashboard V2 View
 *
 * Main view combining import history and wizard.
 * Shows history above the wizard (like V1's ImportDashboardView).
 */

'use client';

import { useState, useCallback } from 'react';
import { IconX, IconUpload } from '@tabler/icons-react';
import { CardBox, Button } from '@/modules/shared';
import { ImportHistoryCard } from '../components/import-history-card';
import { ImportWizardV2 } from '../components/import-wizard-v2';
import type { ImportJobWithStatsV2 } from '../types';
import type { SalesUser } from '@/modules/leads';

interface ImportDashboardV2ViewProps {
  salesUsers: SalesUser[];
  initialJobs: ImportJobWithStatsV2[];
  initialTotal: number;
}

export function ImportDashboardV2View({
  salesUsers,
  initialJobs,
  initialTotal,
}: ImportDashboardV2ViewProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNewImport = useCallback(() => {
    setShowWizard(true);
    // Scroll to wizard after a short delay to allow render
    setTimeout(() => {
      document.getElementById('import-wizard-v2')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  }, []);

  const handleWizardClose = useCallback(() => {
    setShowWizard(false);
  }, []);

  const handleImportComplete = useCallback(() => {
    setShowWizard(false);
    // Refresh history to show new import
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-6">
      {/* History Card - Always visible */}
      <ImportHistoryCard
        key={refreshKey}
        initialJobs={initialJobs}
        initialTotal={initialTotal}
        onNewImport={handleNewImport}
      />

      {/* Wizard Card - Shown when user clicks "Nouvel import" */}
      {showWizard && (
        <div id="import-wizard-v2">
          <CardBox className="border-l-2 border-l-primary/20">
            {/* Wizard Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <IconUpload className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-ld">Nouvel import</h3>
              </div>
              <Button
                variant="circleHover"
                size="iconSm"
                onClick={handleWizardClose}
                title="Fermer"
              >
                <IconX className="w-4 h-4" />
              </Button>
            </div>

            {/* Wizard Content */}
            <ImportWizardV2
              salesUsers={salesUsers}
              onComplete={handleImportComplete}
            />
          </CardBox>
        </div>
      )}
    </div>
  );
}
