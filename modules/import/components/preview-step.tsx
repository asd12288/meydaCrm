'use client';

import { useState } from 'react';
import {
  IconFileSpreadsheet,
  IconX,
  IconCopy,
  IconDatabase,
  IconLoader2,
} from '@tabler/icons-react';
import { PreviewSummaryCards } from './preview-summary-cards';
import { PreviewIssueTable } from './preview-issue-table';
import type { UploadedFile, DetailedValidationSummary } from '../types';

type TabId = 'summary' | 'invalid' | 'file_duplicates' | 'db_duplicates';

interface PreviewStepProps {
  /** Uploaded file info */
  file: UploadedFile;
  /** Detailed validation summary (null while loading) */
  detailedSummary: DetailedValidationSummary | null;
  /** Whether duplicate check is in progress */
  isChecking: boolean;
  /** Import job ID */
  importJobId: string | null;
  /** Selected duplicate strategy */
  duplicateStrategy: 'skip' | 'update' | 'create';
}

const TAB_CONFIG: Record<TabId, { label: string; icon: typeof IconX }> = {
  summary: { label: 'Resume', icon: IconFileSpreadsheet },
  invalid: { label: 'Invalides', icon: IconX },
  file_duplicates: { label: 'Doublons fichier', icon: IconCopy },
  db_duplicates: { label: 'Doublons base', icon: IconDatabase },
};

/**
 * Step 4: Preview & Validation
 * Shows detailed validation with invalid rows, file duplicates, and DB duplicates
 */
export function PreviewStep({
  file,
  detailedSummary,
  isChecking,
  duplicateStrategy,
}: PreviewStepProps) {
  const [activeTab, setActiveTab] = useState<TabId>('summary');

  // Calculate effective counts based on duplicate strategy
  // - 'skip': duplicates are ignored (not imported)
  // - 'update': db duplicates will update existing leads
  // - 'create': duplicates will create new leads anyway
  const getEffectiveCounts = (summary: DetailedValidationSummary) => {
    const baseValid = summary.valid;
    const totalDuplicates = summary.fileDuplicates + summary.dbDuplicates;

    switch (duplicateStrategy) {
      case 'skip':
        // Only base valid rows will be imported
        return {
          willImport: baseValid,
          willSkip: summary.invalid + totalDuplicates,
          dbDuplicatesAction: 'ignorees',
        };
      case 'update':
        // Base valid + db duplicates (will update), file duplicates still skipped
        return {
          willImport: baseValid + summary.dbDuplicates,
          willSkip: summary.invalid + summary.fileDuplicates,
          dbDuplicatesAction: 'mises a jour',
        };
      case 'create':
        // Base valid + db duplicates (will create new), file duplicates still skipped
        return {
          willImport: baseValid + summary.dbDuplicates,
          willSkip: summary.invalid + summary.fileDuplicates,
          dbDuplicatesAction: 'creees comme nouveaux leads',
        };
    }
  };

  // Loading state while parsing and checking duplicates
  if (isChecking || !detailedSummary) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-ld">Apercu de l&apos;import</h3>
          <p className="text-sm text-darklink mt-1">
            Analyse du fichier en cours...
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-16">
          <IconLoader2 size={48} className="text-primary animate-spin mb-4" />
          <p className="text-darklink">Validation et detection des doublons...</p>
          <p className="text-sm text-darklink/70 mt-1">
            Analyse de toutes les lignes du fichier
          </p>
          <p className="text-xs text-darklink/50 mt-3">
            Cette operation peut prendre quelques secondes selon la taille du fichier
          </p>
        </div>
      </div>
    );
  }

  // Get tabs that have content
  const tabs: TabId[] = ['summary'];
  if (detailedSummary.invalid > 0) tabs.push('invalid');
  if (detailedSummary.fileDuplicates > 0) tabs.push('file_duplicates');
  if (detailedSummary.dbDuplicates > 0) tabs.push('db_duplicates');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-ld">Apercu de l&apos;import</h3>
        <p className="text-sm text-darklink mt-1">
          Verifiez les donnees avant de lancer l&apos;import
        </p>
      </div>

      {/* Summary cards */}
      <PreviewSummaryCards
        summary={detailedSummary}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        duplicateStrategy={duplicateStrategy}
      />

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="border-b border-ld">
          <div className="flex gap-1">
            {tabs.map((tabId) => {
              const config = TAB_CONFIG[tabId];
              const count = tabId === 'summary' ? null :
                tabId === 'invalid' ? detailedSummary.invalid :
                tabId === 'file_duplicates' ? detailedSummary.fileDuplicates :
                detailedSummary.dbDuplicates;
              const isActive = activeTab === tabId;

              return (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setActiveTab(tabId)}
                  className={`
                    flex items-center gap-2 px-4 py-2 text-sm font-medium
                    border-b-2 transition-colors -mb-px
                    ${isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-darklink hover:text-ld hover:border-border'}
                  `}
                >
                  <config.icon size={16} />
                  <span>{config.label}</span>
                  {count !== null && (
                    <span className={`
                      px-1.5 py-0.5 text-xs rounded-full
                      ${isActive ? 'bg-primary/10' : 'bg-muted dark:bg-darkmuted'}
                    `}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="min-h-[200px]">
        {activeTab === 'summary' && (
          <div className="space-y-4">
            {/* Summary info */}
            {(() => {
              const counts = getEffectiveCounts(detailedSummary);
              return (
                <div className="bg-muted dark:bg-darkmuted rounded-lg p-4">
                  <h4 className="font-medium text-ld mb-3">Resume de la validation</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-darklink">Fichier</p>
                      <p className="text-ld font-medium">{file.name}</p>
                    </div>
                    <div>
                      <p className="text-darklink">Lignes totales</p>
                      <p className="text-ld font-medium">{detailedSummary.total.toLocaleString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="text-darklink">Seront {duplicateStrategy === 'update' ? 'importes/mis a jour' : 'importes'}</p>
                      <p className="text-primary font-medium">{counts.willImport.toLocaleString('fr-FR')} lignes</p>
                    </div>
                    <div>
                      <p className="text-darklink">Seront ignores</p>
                      <p className="text-warning font-medium">
                        {counts.willSkip.toLocaleString('fr-FR')} lignes
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Warnings */}
            {detailedSummary.jobStatus === 'completed' && (
              <div className="bg-lightwarning/10 border border-warning/20 rounded-lg p-4">
                <p className="text-sm text-warning font-medium">
                  ⚠️ Cet import a deja ete effectue.
                </p>
                <p className="text-sm text-warning/80 mt-1">
                  Pour importer de nouvelles donnees, veuillez telecharger un nouveau fichier.
                  L&apos;apercu ci-dessus montre ce qui se passerait si vous reimportiez ce fichier.
                </p>
              </div>
            )}

            {detailedSummary.dbDuplicates > 0 && detailedSummary.jobStatus !== 'completed' && (
              <div className={`rounded-lg p-4 ${
                duplicateStrategy === 'skip'
                  ? 'bg-lightwarning/10 border border-warning/20'
                  : 'bg-lightinfo/10 border border-info/20'
              }`}>
                <p className={`text-sm ${duplicateStrategy === 'skip' ? 'text-warning' : 'text-info'}`}>
                  <strong>{detailedSummary.dbDuplicates}</strong> lignes existent deja en base.
                  {duplicateStrategy === 'skip' && ' Elles seront ignorees (non importees).'}
                  {duplicateStrategy === 'update' && ' Elles seront mises a jour avec les nouvelles donnees.'}
                  {duplicateStrategy === 'create' && ' Elles seront creees comme nouveaux leads (doublons autorises).'}
                  {' '}Cliquez sur &quot;Doublons base&quot; pour voir les details.
                </p>
              </div>
            )}

            {detailedSummary.invalid > 0 && (
              <div className="bg-lighterror/10 border border-error/20 rounded-lg p-4">
                <p className="text-sm text-error">
                  <strong>{detailedSummary.invalid}</strong> lignes contiennent des erreurs de validation.
                  Cliquez sur &quot;Invalides&quot; pour voir les details.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'invalid' && (
          <PreviewIssueTable
            rows={detailedSummary.invalidRows}
            issueType="invalid"
            emptyMessage="Aucune ligne invalide"
          />
        )}

        {activeTab === 'file_duplicates' && (
          <PreviewIssueTable
            rows={detailedSummary.fileDuplicateRows}
            issueType="file_duplicate"
            emptyMessage="Aucun doublon dans le fichier"
          />
        )}

        {activeTab === 'db_duplicates' && (
          <PreviewIssueTable
            rows={detailedSummary.dbDuplicateRows}
            issueType="db_duplicate"
            emptyMessage="Aucun doublon avec la base existante"
          />
        )}
      </div>
    </div>
  );
}
