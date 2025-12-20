'use client';

import { useState } from 'react';
import { IconChevronDown, IconChevronUp, IconRefresh, IconLoader2 } from '@tabler/icons-react';
import { useActiveImports } from '../hooks/use-active-imports';
import { ActiveImportCard } from './active-import-card';

export function ActiveImportsPanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { activeImports, isLoading, error, isPolling, refresh } = useActiveImports();

  // Don't show panel if no active imports and not loading
  if (!isLoading && activeImports.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="bg-white dark:bg-dark border border-ld rounded-xl overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            {isPolling ? (
              <IconLoader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-ld">
                Imports actifs
                {activeImports.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                    {activeImports.length}
                  </span>
                )}
              </h3>
              <p className="text-sm text-darklink">
                {isLoading
                  ? 'Chargement...'
                  : activeImports.length === 0
                    ? 'Aucun import en cours'
                    : `${activeImports.length} import${activeImports.length > 1 ? 's' : ''} en cours`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                refresh();
              }}
              className="p-1.5 hover:bg-muted rounded-md transition-colors"
              title="Actualiser"
            >
              <IconRefresh className="w-4 h-4 text-darklink" />
            </button>

            {/* Expand/collapse */}
            <button className="p-1.5 hover:bg-muted rounded-md transition-colors">
              {isExpanded ? (
                <IconChevronUp className="w-5 h-5 text-darklink" />
              ) : (
                <IconChevronDown className="w-5 h-5 text-darklink" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="p-4 pt-0 space-y-3">
            {error && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <IconLoader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : activeImports.length > 0 ? (
              activeImports.map((job) => (
                <ActiveImportCard key={job.id} job={job} onCancel={refresh} />
              ))
            ) : (
              <div className="text-center py-6 text-darklink text-sm">
                Aucun import actif. Téléchargez un fichier pour commencer.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
