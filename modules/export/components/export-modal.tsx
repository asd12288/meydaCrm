'use client';

/**
 * Export Modal Component
 *
 * Two-phase modal:
 * 1. Config phase: Select limit, see recent exports, start new export
 * 2. Progress phase: Show status while job runs, download when complete
 */

import { useState, useEffect, useTransition } from 'react';
import {
  IconDownload,
  IconLoader2,
  IconCheck,
  IconX,
  IconFileSpreadsheet,
  IconClock,
} from '@tabler/icons-react';
import { Modal, useToast } from '@/modules/shared';
import { Button } from '@/components/ui/button';
import {
  createExportJob,
  getExportDownloadUrl,
  getActiveExportJob,
  getExportJobs,
} from '../lib/actions';
import { useExportStatus } from '../hooks/use-export-status';
import { EXPORT_LIMITS, EXPORT_STATUS_LABELS } from '../config/constants';
import type { ExportFilters, ExportJob } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ExportFilters;
}

export function ExportModal({ isOpen, onClose, filters }: ExportModalProps) {
  const [selectedLimit, setSelectedLimit] = useState<number | null>(10000);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isCheckingActiveJob, setIsCheckingActiveJob] = useState(false);
  const [recentExports, setRecentExports] = useState<ExportJob[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  // Poll job status when we have an active job
  const { job } = useExportStatus(activeJobId);

  // Check for active job and load recent exports when modal opens
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional reset when modal opens
      setSelectedLimit(10000);
      setIsCheckingActiveJob(true);

      // Load active job and recent exports in parallel
      Promise.all([getActiveExportJob(), getExportJobs(5)]).then(
        ([{ job: activeJob }, { jobs }]) => {
          if (activeJob) {
            setActiveJobId(activeJob.id);
          } else {
            setActiveJobId(null);
          }
          // Filter to only show completed exports
          setRecentExports(jobs.filter((j) => j.status === 'completed'));
          setIsCheckingActiveJob(false);
        }
      );
    }
  }, [isOpen]);

  const handleExport = () => {
    startTransition(async () => {
      const result = await createExportJob(filters, selectedLimit);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Switch to progress view
      if (result.exportJobId) {
        setActiveJobId(result.exportJobId);
      }
    });
  };

  const handleDownload = async () => {
    if (!activeJobId) return;

    setIsDownloading(true);
    const { url, error } = await getExportDownloadUrl(activeJobId);
    setIsDownloading(false);

    if (error) {
      toast.error(error);
      return;
    }

    if (url) {
      // Open download in new tab
      window.open(url, '_blank');
      toast.success('Téléchargement lancé');
      onClose();
    }
  };

  const handleClose = () => {
    // Allow closing even during processing (job continues in background)
    onClose();
  };

  const handleDownloadRecent = async (jobId: string) => {
    setDownloadingId(jobId);
    const { url, error } = await getExportDownloadUrl(jobId);
    setDownloadingId(null);

    if (error) {
      toast.error(error);
      return;
    }

    if (url) {
      window.open(url, '_blank');
      toast.success('Téléchargement lancé');
    }
  };

  // Format relative time
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays}j`;
  };

  // Determine current phase
  const isProgressPhase = activeJobId !== null;
  const isCompleted = job?.status === 'completed';
  const isFailed = job?.status === 'failed';
  const isProcessing = job?.status === 'processing' || job?.status === 'pending';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isProgressPhase ? 'Export en cours' : 'Exporter les leads'}
      icon={isProgressPhase ? <IconFileSpreadsheet size={20} /> : <IconDownload size={20} />}
      size="md"
    >
      {isCheckingActiveJob ? (
        // =====================================================================
        // LOADING CHECK
        // =====================================================================
        <div className="py-8 flex flex-col items-center justify-center">
          <IconLoader2 size={32} className="text-primary animate-spin" />
          <p className="text-sm text-darklink mt-3">Vérification...</p>
        </div>
      ) : !isProgressPhase ? (
        // =====================================================================
        // CONFIG PHASE
        // =====================================================================
        <div className="space-y-5 py-2">
          {/* Limit selector */}
          <div>
            <h3 className="text-sm font-medium text-darklink mb-2">Nombre de leads à exporter</h3>
            <div className="flex flex-wrap gap-2">
              {EXPORT_LIMITS.map((option) => (
                <button
                  key={option.value ?? 'all'}
                  type="button"
                  onClick={() => setSelectedLimit(option.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                    selectedLimit === option.value
                      ? 'border-primary bg-primary text-white'
                      : 'border-ld bg-white dark:bg-darkgray text-ld hover:border-primary hover:text-primary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent exports */}
          {recentExports.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-darklink mb-2 flex items-center gap-1.5">
                <IconClock size={14} />
                Exports récents
              </h3>
              <div className="space-y-2">
                {recentExports.map((exportJob) => (
                  <div
                    key={exportJob.id}
                    className="flex items-center justify-between p-3 bg-lightgray dark:bg-darkgray rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <IconFileSpreadsheet size={20} className="text-success" />
                      <div>
                        <p className="text-sm font-medium text-ld">
                          {exportJob.total_rows?.toLocaleString('fr-FR') || '?'} leads
                        </p>
                        <p className="text-xs text-darklink">
                          {formatTimeAgo(exportJob.completed_at || exportJob.created_at)}
                          {exportJob.file_size_bytes && (
                            <span className="ml-2">
                              ({(exportJob.file_size_bytes / 1024).toFixed(0)} Ko)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadRecent(exportJob.id)}
                      disabled={downloadingId === exportJob.id}
                    >
                      {downloadingId === exportJob.id ? (
                        <IconLoader2 size={16} className="animate-spin" />
                      ) : (
                        <IconDownload size={16} />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-ld">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Annuler
            </Button>
            <Button type="button" variant="primary" onClick={handleExport} disabled={isPending}>
              {isPending ? (
                <>
                  <IconLoader2 size={16} className="animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <IconDownload size={16} />
                  Nouvel export
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        // =====================================================================
        // PROGRESS PHASE
        // =====================================================================
        <div className="py-4">
          {/* Status indicator */}
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Icon */}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isCompleted
                  ? 'bg-success/10'
                  : isFailed
                    ? 'bg-error/10'
                    : 'bg-primary/10'
              }`}
            >
              {isCompleted ? (
                <IconCheck size={32} className="text-success" />
              ) : isFailed ? (
                <IconX size={32} className="text-error" />
              ) : (
                <IconLoader2 size={32} className="text-primary animate-spin" />
              )}
            </div>

            {/* Status text */}
            <div>
              <h3 className="text-lg font-semibold text-ld">
                {isCompleted
                  ? 'Export terminé !'
                  : isFailed
                    ? 'Échec de l\'export'
                    : EXPORT_STATUS_LABELS[job?.status || 'pending']}
              </h3>
              {isProcessing && (
                <p className="text-sm text-darklink mt-1">
                  Vous pouvez fermer cette fenêtre.
                  <br />
                  <span className="text-primary font-medium">
                    Une notification vous préviendra quand l&apos;export sera prêt.
                  </span>
                </p>
              )}
              {isFailed && job?.error_message && (
                <p className="text-sm text-error mt-1">{job.error_message}</p>
              )}
            </div>

            {/* Progress info */}
            {job && (isProcessing || isCompleted) && (
              <div className="w-full max-w-xs">
                {/* Progress bar */}
                {isProcessing && (
                  <div className="h-2 bg-lightgray dark:bg-darkborder rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full animate-pulse w-full" />
                  </div>
                )}

                {/* Stats */}
                {(job.processed_rows || job.total_rows) && (
                  <p className="text-sm text-darklink mt-2">
                    {job.processed_rows?.toLocaleString('fr-FR') || 0} leads traités
                    {job.total_rows && ` sur ${job.total_rows.toLocaleString('fr-FR')}`}
                  </p>
                )}

                {/* File size */}
                {isCompleted && job.file_size_bytes && (
                  <p className="text-xs text-darklink mt-1">
                    Taille: {(job.file_size_bytes / 1024).toFixed(1)} Ko
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3 pt-6 mt-4 border-t border-ld">
            {isCompleted ? (
              <>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Fermer
                </Button>
                <Button
                  type="button"
                  variant="success"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <IconLoader2 size={16} className="animate-spin" />
                      Téléchargement...
                    </>
                  ) : (
                    <>
                      <IconDownload size={16} />
                      Télécharger CSV
                    </>
                  )}
                </Button>
              </>
            ) : isFailed ? (
              <>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Fermer
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setActiveJobId(null)}
                >
                  Réessayer
                </Button>
              </>
            ) : (
              <Button type="button" variant="primary" onClick={handleClose}>
                Fermer
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
