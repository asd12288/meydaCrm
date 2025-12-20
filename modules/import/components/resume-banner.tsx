'use client';

import { IconAlertCircle, IconRefresh, IconX } from '@tabler/icons-react';

interface ResumeBannerProps {
  /** @deprecated not used in component, kept for API compatibility */
  jobId?: string;
  fileName?: string;
  progress: number;
  status: string;
  onResume: () => void;
  onCancel: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  queued: 'en attente',
  parsing: 'en cours d\'analyse',
  importing: 'en cours d\'import',
};

export function ResumeBanner({
  fileName = 'Import',
  progress,
  status,
  onResume,
  onCancel,
}: ResumeBannerProps) {
  const statusLabel = STATUS_LABELS[status] || status;

  return (
    <div className="mb-6 bg-warning/10 border-2 border-warning/30 rounded-xl p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <IconAlertCircle className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />

        <div className="flex-1">
          <h3 className="font-semibold text-ld mb-1">
            Import précédent détecté
          </h3>
          <p className="text-sm text-darklink mb-3">
            <span className="font-medium">{fileName}</span> - {progress}% terminé ({statusLabel})
          </p>

          {/* Progress bar */}
          <div className="h-2 bg-border rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-warning transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onResume}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryemphasis font-medium transition-colors"
            >
              <IconRefresh className="w-4 h-4" />
              Reprendre l&apos;import
            </button>

            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 text-darklink hover:bg-muted rounded-lg font-medium transition-colors"
            >
              <IconX className="w-4 h-4" />
              Annuler et recommencer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
