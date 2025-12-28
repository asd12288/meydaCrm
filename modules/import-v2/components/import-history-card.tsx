/**
 * Import History Card (V2)
 *
 * Displays a table of past imports with status, actions, and pagination.
 * Based on V1's RecentHistoryCard but adapted for V2 architecture.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  IconPlus,
  IconCheck,
  IconX,
  IconClock,
  IconLoader2,
  IconTrash,
  IconDownload,
  IconFileSpreadsheet,
} from '@tabler/icons-react';
import { CardBox, ConfirmDialog, FormErrorAlert, Pagination, Button } from '@/modules/shared';
import {
  getPaginatedImportJobsV2,
  downloadImportFileV2,
  deleteImportJobV2,
} from '../lib/actions';
import type { ImportJobWithStatsV2, ImportStatus } from '../types';

// Polling interval in ms (3 seconds)
const POLL_INTERVAL_MS = 3000;

// Statuses that indicate an active job requiring polling
const ACTIVE_STATUSES: ImportStatus[] = ['queued', 'pending', 'parsing', 'importing'];

const STATUS_CONFIG: Record<ImportStatus, { label: string; color: string; icon: typeof IconCheck }> = {
  pending: { label: 'En attente', color: 'text-darklink', icon: IconClock },
  queued: { label: 'En file', color: 'text-primary', icon: IconClock },
  parsing: { label: 'Validation', color: 'text-primary', icon: IconLoader2 },
  validating: { label: 'Validation', color: 'text-primary', icon: IconLoader2 },
  ready: { label: 'Pret', color: 'text-primary', icon: IconCheck },
  importing: { label: 'Import', color: 'text-primary', icon: IconLoader2 },
  completed: { label: 'Termine', color: 'text-success', icon: IconCheck },
  failed: { label: 'Echoue', color: 'text-error', icon: IconX },
  cancelled: { label: 'Annule', color: 'text-darklink', icon: IconX },
};

/**
 * Calculate import progress percentage
 * - Parsing phase (0-50%): based on chunks
 * - Importing phase (50-100%): based on imported rows
 */
function calculateProgress(job: ImportJobWithStatsV2): { percentage: number; isIndeterminate: boolean } {
  if (job.status === 'completed') {
    return { percentage: 100, isIndeterminate: false };
  }

  if (job.status === 'parsing' || job.status === 'validating') {
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

const PAGE_SIZE = 10;

interface ImportHistoryCardProps {
  initialJobs: ImportJobWithStatsV2[];
  initialTotal: number;
  onNewImport: () => void;
}

export function ImportHistoryCard({
  initialJobs,
  initialTotal,
  onNewImport,
}: ImportHistoryCardProps) {
  const [jobs, setJobs] = useState<ImportJobWithStatsV2[]>(initialJobs);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(Math.ceil(initialTotal / PAGE_SIZE));
  const [page, setPage] = useState(1);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'delete';
    jobId: string;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refreshJobs = useCallback(async (targetPage: number = page) => {
    const result = await getPaginatedImportJobsV2(targetPage, PAGE_SIZE);
    if (result.success && result.data) {
      setJobs(result.data.jobs);
      setTotal(result.data.total);
      setTotalPages(result.data.totalPages);
    }
  }, [page]);

  // Check if there are any active jobs that need polling
  const hasActiveJobs = jobs.some((job) => ACTIVE_STATUSES.includes(job.status as ImportStatus));

  // Poll for updates when there are active jobs
  useEffect(() => {
    if (!hasActiveJobs) return;

    // Initial refresh to get latest state
    refreshJobs();

    // Set up polling interval
    const intervalId = setInterval(refreshJobs, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [hasActiveJobs, refreshJobs]);

  const handleDeleteClick = (jobId: string) => {
    setConfirmDialog({ type: 'delete', jobId });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDialog || confirmDialog.type !== 'delete') return;

    setActionError(null);
    setActionInProgress(confirmDialog.jobId);
    try {
      const result = await deleteImportJobV2(confirmDialog.jobId);
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

  const handlePageChange = async (newPage: number) => {
    setPage(newPage);
    await refreshJobs(newPage);
  };

  const handleDownload = async (jobId: string, storagePath: string) => {
    // Check if file is available
    if (!storagePath || storagePath === 'client-parsed') {
      setActionError('Fichier non disponible');
      return;
    }

    setActionError(null);
    setActionInProgress(jobId);
    try {
      const result = await downloadImportFileV2(jobId);
      if (result.success && result.data) {
        const link = document.createElement('a');
        link.href = result.data.url;
        link.download = result.data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setActionError(result.error || 'Erreur lors du telechargement');
      }
    } catch {
      setActionError('Erreur lors du telechargement');
    } finally {
      setActionInProgress(null);
    }
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
                  <th className="px-4 py-2.5 text-right font-medium text-darklink">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.map((job) => {
                  const statusConfig = STATUS_CONFIG[job.status as ImportStatus] || STATUS_CONFIG.pending;
                  const StatusIcon = statusConfig.icon;
                  const canDelete = !['parsing', 'importing'].includes(job.status);
                  const isActive = ['parsing', 'importing', 'validating'].includes(job.status);
                  const canDownload = job.storage_path && job.storage_path !== 'client-parsed';

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
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="circleHover"
                            size="iconSm"
                            onClick={() => handleDownload(job.id, job.storage_path)}
                            disabled={actionInProgress === job.id || !canDownload}
                            title={canDownload ? 'Telecharger le fichier' : 'Fichier non disponible'}
                            className={!canDownload ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            <IconDownload className="w-4 h-4" />
                          </Button>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                total={total}
                page={page}
                pageSize={PAGE_SIZE}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      {/* Confirmation dialog for delete */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog !== null}
          onClose={handleConfirmCancel}
          onConfirm={handleDeleteConfirm}
          title="Supprimer l'import"
          message="Voulez-vous vraiment supprimer cet import ? Cette action est irreversible."
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          variant="danger"
          isPending={isPending}
        />
      )}
    </CardBox>
  );
}
