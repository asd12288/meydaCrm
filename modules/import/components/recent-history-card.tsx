'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  IconPlus,
  IconCheck,
  IconX,
  IconClock,
  IconLoader2,
  IconRefresh,
  IconTrash,
  IconChevronRight,
  IconFileSpreadsheet,
} from '@tabler/icons-react';
import { CardBox, ConfirmDialog, FormErrorAlert } from '@/modules/shared';
import { Button } from '@/components/ui/button';
import { retryImportJob, deleteImportJob, getRecentImportJobs } from '../lib/actions';
import type { ImportJobWithStats } from '../types';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof IconCheck }> = {
  pending: { label: 'En attente', color: 'text-darklink', icon: IconClock },
  queued: { label: 'En file', color: 'text-primary', icon: IconClock },
  parsing: { label: 'Validation', color: 'text-primary', icon: IconLoader2 },
  ready: { label: 'Prêt', color: 'text-primary', icon: IconCheck },
  importing: { label: 'Import', color: 'text-primary', icon: IconLoader2 },
  completed: { label: 'Terminé', color: 'text-success', icon: IconCheck },
  failed: { label: 'Échoué', color: 'text-error', icon: IconX },
  cancelled: { label: 'Annulé', color: 'text-darklink', icon: IconX },
};

/**
 * Calculate import progress percentage
 * - Parsing phase (0-50%): based on chunks
 * - Importing phase (50-100%): based on imported rows
 */
function calculateProgress(job: ImportJobWithStats): { percentage: number; isIndeterminate: boolean } {
  if (job.status === 'completed') {
    return { percentage: 100, isIndeterminate: false };
  }

  if (job.status === 'parsing') {
    const totalChunks = job.total_chunks || 0;
    const currentChunk = job.current_chunk || 0;
    if (totalChunks > 0) {
      return {
        percentage: Math.round((currentChunk / totalChunks) * 50),
        isIndeterminate: false,
      };
    }
    return { percentage: 0, isIndeterminate: true };
  }

  if (job.status === 'importing') {
    const validRows = job.valid_rows || 0;
    const importedRows = job.imported_rows || 0;
    if (validRows > 0) {
      return {
        percentage: 50 + Math.round((importedRows / validRows) * 50),
        isIndeterminate: false,
      };
    }
    return { percentage: 50, isIndeterminate: true };
  }

  return { percentage: 0, isIndeterminate: false };
}

interface RecentHistoryCardProps {
  initialJobs: ImportJobWithStats[];
  initialTotal: number;
  onNewImport: () => void;
}

export function RecentHistoryCard({
  initialJobs,
  initialTotal,
  onNewImport,
}: RecentHistoryCardProps) {
  const [jobs, setJobs] = useState<ImportJobWithStats[]>(initialJobs);
  const [total, setTotal] = useState(initialTotal);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'retry' | 'delete';
    jobId: string;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refreshJobs = async () => {
    const result = await getRecentImportJobs(10);
    if (result.success && result.data) {
      setJobs(result.data.jobs);
      setTotal(result.data.total);
    }
  };

  const handleRetryClick = (jobId: string) => {
    setConfirmDialog({ type: 'retry', jobId });
  };

  const handleRetryConfirm = async () => {
    if (!confirmDialog || confirmDialog.type !== 'retry') return;

    setActionError(null);
    setActionInProgress(confirmDialog.jobId);
    try {
      const result = await retryImportJob(confirmDialog.jobId, 'parse');
      if (result.success) {
        setConfirmDialog(null);
        await refreshJobs();
      } else {
        setActionError(result.error || 'Erreur lors de la relance');
      }
    } catch {
      setActionError('Erreur lors de la relance');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteClick = (jobId: string) => {
    setConfirmDialog({ type: 'delete', jobId });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDialog || confirmDialog.type !== 'delete') return;

    setActionError(null);
    setActionInProgress(confirmDialog.jobId);
    try {
      const result = await deleteImportJob(confirmDialog.jobId);
      if (result.success) {
        setConfirmDialog(null);
        await refreshJobs();
      } else {
        setActionError(result.error || 'Erreur lors de la suppression');
      }
    } catch {
      setActionError('Erreur lors de la suppression');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleConfirmCancel = () => {
    setConfirmDialog(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getConfirmDialogProps = () => {
    if (!confirmDialog) return null;

    if (confirmDialog.type === 'retry') {
      return {
        title: "Relancer l'import",
        message: 'Voulez-vous vraiment relancer cet import ?',
        confirmLabel: 'Relancer',
        variant: 'warning' as const,
      };
    } else {
      return {
        title: "Supprimer l'import",
        message: 'Voulez-vous vraiment supprimer cet import ? Cette action est irréversible.',
        confirmLabel: 'Supprimer',
        variant: 'danger' as const,
      };
    }
  };

  const dialogProps = getConfirmDialogProps();
  const isPending = confirmDialog ? actionInProgress === confirmDialog.jobId : false;

  return (
    <CardBox>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <IconFileSpreadsheet className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-ld">Historique des imports</h3>
          <span className="text-sm text-darklink">({total})</span>
        </div>
        <Button variant="primary" onClick={onNewImport}>
          <IconPlus className="w-4 h-4" />
          Nouvel import
        </Button>
      </div>

      {/* Error alert */}
      {actionError && <FormErrorAlert error={actionError} className="mb-4" />}

      {/* Table or empty state */}
      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <IconFileSpreadsheet className="w-12 h-12 text-darklink mx-auto mb-4" />
          <h4 className="text-lg font-medium text-ld mb-2">Aucun import</h4>
          <p className="text-darklink mb-4">Commencez par importer un fichier de leads</p>
          <Button variant="primary" onClick={onNewImport}>
            <IconPlus className="w-4 h-4" />
            Premier import
          </Button>
        </div>
      ) : (
        <>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted dark:bg-darkmuted">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-darklink">Date</th>
                  <th className="px-4 py-2.5 text-left font-medium text-darklink">Fichier</th>
                  <th className="px-4 py-2.5 text-left font-medium text-darklink">Statut</th>
                  <th className="px-4 py-2.5 text-right font-medium text-darklink">Lignes</th>
                  <th className="px-4 py-2.5 text-right font-medium text-darklink">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.map((job) => {
                  const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusConfig.icon;
                  const canRetry = job.status === 'failed';
                  const canDelete = !['parsing', 'importing'].includes(job.status);
                  const isActive = ['parsing', 'importing'].includes(job.status);

                  return (
                    <tr key={job.id} className="hover:bg-muted/50">
                      <td className="px-4 py-2.5 whitespace-nowrap text-darklink">
                        {formatDate(job.created_at)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="max-w-[200px] truncate text-ld" title={job.file_name}>
                          {job.file_name}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="space-y-1">
                          <div className={`flex items-center gap-1.5 ${statusConfig.color}`}>
                            <StatusIcon
                              className={`w-4 h-4 ${isActive ? 'animate-spin' : ''}`}
                            />
                            <span className="text-sm">{statusConfig.label}</span>
                            {isActive && (() => {
                              const { percentage, isIndeterminate } = calculateProgress(job);
                              if (!isIndeterminate) {
                                return (
                                  <span className="text-xs font-medium ml-1">
                                    {percentage}%
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          {/* Progress bar for active imports */}
                          {isActive && (
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                              {(() => {
                                const { percentage, isIndeterminate } = calculateProgress(job);
                                if (isIndeterminate) {
                                  return (
                                    <div className="h-full bg-primary/50 w-1/3 animate-indeterminate" />
                                  );
                                }
                                return (
                                  <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                  />
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-ld font-medium">
                          {job.imported_rows?.toLocaleString('fr-FR') || '-'}
                        </span>
                        <span className="text-darklink"> / </span>
                        <span className="text-darklink">
                          {job.total_rows?.toLocaleString('fr-FR') || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          {canRetry && (
                            <Button
                              variant="circleHover"
                              size="iconSm"
                              onClick={() => handleRetryClick(job.id)}
                              disabled={actionInProgress === job.id}
                              title="Relancer"
                            >
                              <IconRefresh className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="circleHover"
                              size="iconSm"
                              onClick={() => handleDeleteClick(job.id)}
                              disabled={actionInProgress === job.id}
                              className="text-error hover:bg-error/10"
                              title="Supprimer"
                            >
                              <IconTrash className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {total > jobs.length && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-sm text-darklink">
                Affichage {jobs.length} sur {total} imports
              </p>
              <Link
                href="/import/history"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Voir tout l&apos;historique
                <IconChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </>
      )}

      {/* Confirmation dialogs */}
      {dialogProps && (
        <ConfirmDialog
          isOpen={confirmDialog !== null}
          onClose={handleConfirmCancel}
          onConfirm={confirmDialog?.type === 'retry' ? handleRetryConfirm : handleDeleteConfirm}
          title={dialogProps.title}
          message={dialogProps.message}
          confirmLabel={dialogProps.confirmLabel}
          cancelLabel="Annuler"
          variant={dialogProps.variant}
          isPending={isPending}
        />
      )}
    </CardBox>
  );
}
