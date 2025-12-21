'use client';

import { IconAlertCircle, IconRefresh, IconTrash, IconFileText } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error: string;
  phase?: string;
  processedRows?: number;
  totalRows?: number;
  onRetry?: () => void;
  onCancel?: () => void;
  onViewLogs?: () => void;
}

export function ErrorDisplay({
  error,
  phase,
  processedRows,
  totalRows,
  onRetry,
  onCancel,
  onViewLogs,
}: ErrorDisplayProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-error/5 border-2 border-error/20 rounded-xl p-6">
        {/* Icon and title */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
            <IconAlertCircle className="w-6 h-6 text-error" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-error mb-1">
              Erreur lors de l&apos;import
            </h3>
            
            {/* Error message */}
            <p className="text-sm text-ld mb-3">{error}</p>

            {/* Context info */}
            {(phase || processedRows !== undefined) && (
              <div className="flex items-center gap-4 text-sm text-darklink mb-4">
                {phase && (
                  <span>
                    <span className="font-medium">Phase:</span> {phase}
                  </span>
                )}
                {processedRows !== undefined && totalRows && (
                  <span>
                    <span className="font-medium">Progression:</span>{' '}
                    {processedRows.toLocaleString('fr-FR')} / {totalRows.toLocaleString('fr-FR')}
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {onRetry && (
                <Button variant="primary" onClick={onRetry}>
                  <IconRefresh className="w-4 h-4" />
                  Réessayer
                </Button>
              )}

              {onViewLogs && (
                <Button variant="outline" onClick={onViewLogs}>
                  <IconFileText className="w-4 h-4" />
                  Voir les logs
                </Button>
              )}

              {onCancel && (
                <Button variant="ghostDanger" onClick={onCancel}>
                  <IconTrash className="w-4 h-4" />
                  Annuler et supprimer
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Help text */}
        <div className="mt-4 pt-4 border-t border-error/20">
          <p className="text-sm text-darklink">
            💡 <span className="font-medium">Conseil:</span> Vérifiez les logs dans la console
            pour plus de détails sur l&apos;erreur.
          </p>
        </div>
      </div>
    </div>
  );
}
