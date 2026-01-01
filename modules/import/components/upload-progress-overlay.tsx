'use client';

import { IconCheck, IconUpload } from '@tabler/icons-react';
import { Spinner } from '@/modules/shared';
import type { UploadProgress } from '../lib/client-upload';

interface UploadProgressOverlayProps {
  progress: UploadProgress | null;
  fileName?: string;
}

const PHASE_LABELS: Record<UploadProgress['phase'], string> = {
  hashing: 'Calcul de l\'empreinte',
  uploading: 'Téléchargement',
  creating_job: 'Création de l\'import',
  complete: 'Terminé',
};

export function UploadProgressOverlay({ progress, fileName }: UploadProgressOverlayProps) {
  if (!progress) return null;

  const isComplete = progress.phase === 'complete';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white dark:bg-dark border border-ld rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-slide-in-down">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {isComplete ? (
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <IconCheck className="w-6 h-6 text-success" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <IconUpload className="w-6 h-6 text-primary" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-ld">
              {isComplete ? 'Fichier téléchargé' : 'Téléchargement en cours'}
            </h3>
            {fileName && (
              <p className="text-sm text-darklink truncate">{fileName}</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-darklink">{PHASE_LABELS[progress.phase]}</span>
            <span className="font-semibold text-ld">{progress.percentage}%</span>
          </div>
          
          <div className="h-3 bg-border rounded-full overflow-hidden relative">
            <div
              className="h-full bg-primary transition-all duration-300 relative"
              style={{ width: `${progress.percentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Status message */}
        <div className="flex items-center gap-2 text-sm text-darklink">
          {!isComplete && (
            <Spinner size="sm" />
          )}
          <span>{progress.message}</span>
        </div>

        {/* Bytes uploaded (if available) */}
        {progress.bytesUploaded !== undefined && progress.totalBytes && (
          <p className="text-xs text-darklink mt-2">
            {(progress.bytesUploaded / 1024 / 1024).toFixed(2)} MB /{' '}
            {(progress.totalBytes / 1024 / 1024).toFixed(2)} MB
          </p>
        )}
      </div>
    </div>
  );
}


