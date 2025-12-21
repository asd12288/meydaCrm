'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IconUpload,
  IconCheck,
  IconX,
  IconClock,
  IconLoader2,
  IconAlertCircle,
  IconRefresh,
  IconTrash,
} from '@tabler/icons-react';
import { ConfirmDialog, FormErrorAlert, ErrorBoundary, SectionErrorFallback } from '@/modules/shared';
import { getImportJobs, getErrorReportUrl, retryImportJob, deleteImportJob } from '../lib/actions';
import type { ImportJobWithStats } from '../types';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof IconCheck }> = {
  pending: { label: 'En attente', color: 'text-darklink', icon: IconClock },
  queued: { label: 'En file', color: 'text-primary', icon: IconClock },
  parsing: { label: 'Analyse', color: 'text-primary', icon: IconLoader2 },
  ready: { label: 'Prêt', color: 'text-success', icon: IconCheck },
  importing: { label: 'Import', color: 'text-primary', icon: IconLoader2 },
  completed: { label: 'Terminé', color: 'text-success', icon: IconCheck },
  failed: { label: 'Échoué', color: 'text-error', icon: IconX },
  cancelled: { label: 'Annulé', color: 'text-darklink', icon: IconX },
};

export function ImportHistoryView() {
  const [jobs, setJobs] = useState<ImportJobWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'retry' | 'delete';
    jobId: string;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getImportJobs();
      if (result.success && result.data) {
        setJobs(result.data);
      } else {
        setError(result.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError('Erreur lors du chargement');
      console.error(err);
    } finally {
      setLoading(false);
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
    } catch (err) {
      setActionError('Erreur lors du téléchargement');
      console.error(err);
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
        await loadJobs();
      } else {
        setActionError(result.error || 'Erreur lors de la relance');
      }
    } catch (err) {
      setActionError('Erreur lors de la relance');
      console.error(err);
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
        await loadJobs();
      } else {
        setActionError(result.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setActionError('Erreur lors de la suppression');
      console.error(err);
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startedAt: string | null, completedAt: string | null) => {
    if (!startedAt || !completedAt) return '-';
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <IconAlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <p className="text-error">{error}</p>
          <button
            onClick={loadJobs}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primaryemphasis"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const getConfirmDialogProps = () => {
    if (!confirmDialog) return null;

    if (confirmDialog.type === 'retry') {
      return {
        title: 'Relancer l\'import',
        message: 'Voulez-vous vraiment relancer cet import ?',
        confirmLabel: 'Relancer',
        variant: 'warning' as const,
      };
    } else {
      return {
        title: 'Supprimer l\'import',
        message: 'Voulez-vous vraiment supprimer cet import ? Cette action est irréversible.',
        confirmLabel: 'Supprimer',
        variant: 'danger' as const,
      };
    }
  };

  const dialogProps = getConfirmDialogProps();
  const isPending = confirmDialog ? actionInProgress === confirmDialog.jobId : false;

  return (
    <div className="space-y-4">
      {/* Action error alert */}
      {actionError && (
        <FormErrorAlert error={actionError} className="mb-4" />
      )}

      {/* Stats */}
      <p className="text-sm text-darklink">
        {jobs.length} import{jobs.length > 1 ? 's' : ''} au total
      </p>

      {/* Table */}
      {jobs.length === 0 ? (
        <div className="bg-white dark:bg-dark border border-ld rounded-xl p-12 text-center">
          <IconUpload className="w-16 h-16 text-darklink mx-auto mb-4" />
          <h3 className="text-lg font-medium text-ld mb-2">Aucun import</h3>
          <p className="text-darklink mb-4">Commencez par importer un fichier de leads</p>
          <Link
            href="/import"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primaryemphasis"
          >
            <IconUpload className="w-4 h-4" />
            Premier import
          </Link>
        </div>
      ) : (
        <ErrorBoundary FallbackComponent={SectionErrorFallback}>
          <div className="bg-white dark:bg-dark border border-ld rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
              <thead className="bg-muted border-b border-ld">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Fichier</th>
                  <th className="px-4 py-3 text-left font-semibold">Statut</th>
                  <th className="px-4 py-3 text-right font-semibold">Lignes</th>
                  <th className="px-4 py-3 text-right font-semibold">Importées</th>
                  <th className="px-4 py-3 text-right font-semibold">Erreurs</th>
                  <th className="px-4 py-3 text-right font-semibold">Durée</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.map((job) => {
                  const statusConfig = STATUS_CONFIG[job.status];
                  const StatusIcon = statusConfig.icon;
                  const canRetry = job.status === 'failed';
                  const canDelete = !['parsing', 'importing'].includes(job.status);
                  const hasErrors = (job.invalid_rows || 0) > 0;

                  return (
                    <tr key={job.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDate(job.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs truncate" title={job.file_name}>
                          {job.file_name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`flex items-center gap-2 ${statusConfig.color}`}>
                          <StatusIcon
                            className={`w-4 h-4 ${job.status === 'importing' || job.status === 'parsing' ? 'animate-spin' : ''}`}
                          />
                          {statusConfig.label}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {job.total_rows?.toLocaleString('fr-FR') || '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-success font-medium">
                        {job.imported_rows?.toLocaleString('fr-FR') || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {hasErrors ? (
                          <button
                            onClick={() => handleDownloadErrors(job.id)}
                            className="text-error hover:underline font-medium"
                          >
                            {job.invalid_rows}
                          </button>
                        ) : (
                          <span className="text-darklink">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-darklink">
                        {formatDuration(job.started_at, job.completed_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {canRetry && (
                            <button
                              onClick={() => handleRetryClick(job.id)}
                              disabled={actionInProgress === job.id}
                              className="p-1 text-primary hover:bg-primary/10 rounded disabled:opacity-50"
                              title="Relancer"
                            >
                              <IconRefresh className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteClick(job.id)}
                              disabled={actionInProgress === job.id}
                              className="p-1 text-error hover:bg-error/10 rounded disabled:opacity-50"
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
          </div>
        </ErrorBoundary>
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
    </div>
  );
}
