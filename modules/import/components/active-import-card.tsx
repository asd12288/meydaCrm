'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconLoader2,
  IconCheck,
  IconClock,
  IconChevronDown,
  IconChevronUp,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { ConfirmDialog } from '@/modules/shared';
import { cancelImportJob } from '../lib/actions';
import type { ImportJobWithStats } from '../types';

interface ActiveImportCardProps {
  job: ImportJobWithStats;
  onCancel?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof IconClock }> = {
  queued: { label: 'En attente', color: 'text-primary', icon: IconClock },
  parsing: { label: 'Analyse', color: 'text-primary', icon: IconLoader2 },
  importing: { label: 'Import', color: 'text-primary', icon: IconLoader2 },
  ready: { label: 'Prêt', color: 'text-success', icon: IconCheck },
};

export function ActiveImportCard({ job, onCancel }: ActiveImportCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.queued;

  // Jobs that can be resumed (pending/ready - waiting for user action)
  const canResume = ['pending', 'ready'].includes(job.status);

  const handleResume = () => {
    router.push(`/import?resume=${job.id}`);
  };
  const StatusIcon = statusConfig.icon;

  const percentage =
    job.total_rows && job.processed_rows
      ? Math.round((job.processed_rows / job.total_rows) * 100)
      : 0;

  const timeElapsed = job.started_at
    ? formatDuration(new Date(job.started_at), new Date())
    : '0s';

  const speed =
    job.started_at && job.processed_rows
      ? Math.round(
          job.processed_rows /
            ((Date.now() - new Date(job.started_at).getTime()) / 1000)
        )
      : 0;

  const handleCancelClick = () => {
    setShowConfirmDialog(true);
  };

  const handleCancelConfirm = async () => {
    setIsCancelling(true);
    try {
      await cancelImportJob(job.id);
      setShowConfirmDialog(false);
      onCancel?.();
    } catch (error) {
      console.error('Cancel error:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelCancel = () => {
    setShowConfirmDialog(false);
  };

  return (
    <div className="border border-ld rounded-lg bg-white dark:bg-dark overflow-hidden">
      {/* Main row - always visible */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* File name and status */}
            <div className="flex items-center gap-2 mb-2">
              <StatusIcon
                className={`w-4 h-4 ${statusConfig.color} ${
                  job.status === 'parsing' || job.status === 'importing'
                    ? 'animate-spin'
                    : ''
                }`}
              />
              <h4 className="font-medium text-ld truncate">{job.file_name}</h4>
              <span className={`text-sm ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>

            {/* Progress bar */}
            {job.total_rows && (
              <div className="mb-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-darklink">
              {job.total_rows && (
                <>
                  <span className="font-medium text-ld">{percentage}%</span>
                  <span>
                    {(job.processed_rows || 0).toLocaleString('fr-FR')} /{' '}
                    {job.total_rows.toLocaleString('fr-FR')}
                  </span>
                </>
              )}
              <span>{timeElapsed}</span>
              {speed > 0 && <span>{speed.toLocaleString('fr-FR')} lignes/s</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Resume button - for pending/ready jobs */}
            {canResume && (
              <button
                onClick={handleResume}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-md transition-colors"
              >
                <IconPlayerPlay size={16} />
                Reprendre
              </button>
            )}

            {/* Cancel button */}
            {['queued', 'parsing', 'importing'].includes(job.status) && (
              <button
                onClick={handleCancelClick}
                disabled={isCancelling}
                className="px-3 py-1.5 text-sm text-error hover:bg-error/10 rounded-md transition-colors disabled:opacity-50"
              >
                {isCancelling ? 'Annulation...' : 'Annuler'}
              </button>
            )}

            {/* Expand button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-muted rounded-md transition-colors"
            >
              {isExpanded ? (
                <IconChevronUp className="w-5 h-5" />
              ) : (
                <IconChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-ld bg-muted/30">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-darklink">Total</p>
              <p className="font-medium text-ld">
                {job.total_rows?.toLocaleString('fr-FR') || '-'}
              </p>
            </div>
            <div>
              <p className="text-darklink">Valides</p>
              <p className="font-medium text-success">
                {job.valid_rows?.toLocaleString('fr-FR') || '-'}
              </p>
            </div>
            <div>
              <p className="text-darklink">Invalides</p>
              <p className="font-medium text-error">
                {job.invalid_rows?.toLocaleString('fr-FR') || '-'}
              </p>
            </div>
            <div>
              <p className="text-darklink">Importées</p>
              <p className="font-medium text-ld">
                {job.imported_rows?.toLocaleString('fr-FR') || '-'}
              </p>
            </div>
          </div>

          {job.error_message && (
            <div className="mt-3 p-2 bg-error/10 border border-error/20 rounded text-sm text-error">
              {job.error_message}
            </div>
          )}
        </div>
      )}

      {/* Cancel confirmation dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelCancel}
        onConfirm={handleCancelConfirm}
        title="Annuler l'import"
        message="Voulez-vous vraiment annuler cet import ? Cette action est irréversible."
        confirmLabel="Annuler l'import"
        cancelLabel="Non, continuer"
        variant="warning"
        isPending={isCancelling}
      />
    </div>
  );
}

function formatDuration(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return `${diffSec}s`;

  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;

  if (mins < 60) return `${mins}m ${secs}s`;

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}
