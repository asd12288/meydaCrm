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
  IconDownload,
  IconChevronRight,
  IconFileSpreadsheet,
} from '@tabler/icons-react';
import { CardBox, ConfirmDialog, FormErrorAlert } from '@/modules/shared';
import { getErrorReportUrl, retryImportJob, deleteImportJob, getRecentImportJobs } from '../lib/actions';
import type { ImportJobWithStats } from '../types';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof IconCheck }> = {
  pending: { label: 'En attente', color: 'text-darklink', icon: IconClock },
  queued: { label: 'En file', color: 'text-primary', icon: IconClock },
  parsing: { label: 'Analyse', color: 'text-primary', icon: IconLoader2 },
  ready: { label: 'Prêt', color: 'text-primary', icon: IconCheck },
  importing: { label: 'Import', color: 'text-primary', icon: IconLoader2 },
  completed: { label: 'Terminé', color: 'text-success', icon: IconCheck },
  failed: { label: 'Échoué', color: 'text-error', icon: IconX },
  cancelled: { label: 'Annulé', color: 'text-darklink', icon: IconX },
};

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

  const handleDownloadErrors = async (jobId: string) => {
    setActionError(null);
    try {
      const result = await getErrorReportUrl(jobId);
      if (result.success && result.data?.url) {
        const link = document.createElement('a');
        link.href = result.data.url;
        link.download = `erreurs-import-${jobId}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setActionError(result.error || 'Erreur lors du téléchargement');
      }
    } catch {
      setActionError('Erreur lors du téléchargement');
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
        <button
          onClick={onNewImport}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryemphasis transition-colors"
        >
          <IconPlus className="w-4 h-4" />
          Nouvel import
        </button>
      </div>

      {/* Error alert */}
      {actionError && <FormErrorAlert error={actionError} className="mb-4" />}

      {/* Table or empty state */}
      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <IconFileSpreadsheet className="w-12 h-12 text-darklink mx-auto mb-4" />
          <h4 className="text-lg font-medium text-ld mb-2">Aucun import</h4>
          <p className="text-darklink mb-4">Commencez par importer un fichier de leads</p>
          <button
            onClick={onNewImport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryemphasis transition-colors"
          >
            <IconPlus className="w-4 h-4" />
            Premier import
          </button>
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
                  const hasErrors = (job.invalid_rows || 0) > 0;
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
                        <div className={`flex items-center gap-1.5 ${statusConfig.color}`}>
                          <StatusIcon
                            className={`w-4 h-4 ${isActive ? 'animate-spin' : ''}`}
                          />
                          <span className="text-sm">{statusConfig.label}</span>
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
                          {hasErrors && (
                            <button
                              onClick={() => handleDownloadErrors(job.id)}
                              className="p-1.5 text-darklink hover:text-error hover:bg-error/10 rounded transition-colors"
                              title="Télécharger les erreurs"
                            >
                              <IconDownload className="w-4 h-4" />
                            </button>
                          )}
                          {canRetry && (
                            <button
                              onClick={() => handleRetryClick(job.id)}
                              disabled={actionInProgress === job.id}
                              className="p-1.5 text-darklink hover:text-primary hover:bg-primary/10 rounded transition-colors disabled:opacity-50"
                              title="Relancer"
                            >
                              <IconRefresh className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteClick(job.id)}
                              disabled={actionInProgress === job.id}
                              className="p-1.5 text-darklink hover:text-error hover:bg-error/10 rounded transition-colors disabled:opacity-50"
                              title="Supprimer"
                            >
                              <IconTrash className="w-4 h-4" />
                            </button>
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
