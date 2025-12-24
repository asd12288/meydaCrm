'use client';

import {
  IconCheck,
  IconAlertTriangle,
  IconX,
} from '@tabler/icons-react';
import type { UploadedFile } from '../types';

interface PreviewStepProps {
  /** Uploaded file info */
  file: UploadedFile;
  /** Validation summary */
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
  };
  /** Import job ID */
  importJobId: string | null;
}

/**
 * Step 4: Preview & Validation
 * Shows validation summary before committing the import
 */
export function PreviewStep({
  file,
  summary,
}: PreviewStepProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-ld">Apercu de l&apos;import</h3>
        <p className="text-sm text-darklink mt-1">
          Verifiez les donnees avant de lancer l&apos;import
        </p>
      </div>

      {/* Summary cards - compact 2x2 grid */}
      <div className="grid grid-cols-4 gap-3">
        {/* Total rows */}
        <div className="bg-muted dark:bg-darkmuted rounded-lg p-3 text-center">
          <p className="text-xs text-darklink mb-1">Total</p>
          <p className="text-xl font-bold text-ld">
            {summary.total.toLocaleString('fr-FR')}
          </p>
        </div>

        {/* Valid rows */}
        <div className="bg-lightprimary/20 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <IconCheck size={14} className="text-primary" />
            <p className="text-xs text-primary">Valides</p>
          </div>
          <p className="text-xl font-bold text-primary">
            {summary.valid.toLocaleString('fr-FR')}
          </p>
        </div>

        {/* Invalid rows */}
        <div className={`rounded-lg p-3 text-center ${summary.invalid > 0 ? 'bg-lighterror/20' : 'bg-muted dark:bg-darkmuted'}`}>
          <div className="flex items-center justify-center gap-1 mb-1">
            <IconX size={14} className={summary.invalid > 0 ? 'text-error' : 'text-darklink'} />
            <p className={`text-xs ${summary.invalid > 0 ? 'text-error' : 'text-darklink'}`}>Invalides</p>
          </div>
          <p className={`text-xl font-bold ${summary.invalid > 0 ? 'text-error' : 'text-darklink'}`}>
            {summary.invalid.toLocaleString('fr-FR')}
          </p>
        </div>

        {/* Duplicates - detected during import */}
        <div className="rounded-lg p-3 text-center bg-muted dark:bg-darkmuted">
          <div className="flex items-center justify-center gap-1 mb-1">
            <IconAlertTriangle size={14} className="text-darklink" />
            <p className="text-xs text-darklink">Doublons</p>
          </div>
          <p className="text-sm font-medium text-darklink">
            Detectes a l&apos;import
          </p>
        </div>
      </div>

      {/* File info */}
      <div className="text-center text-sm text-darklink">
        {file.name} • {file.rowCount.toLocaleString('fr-FR')} lignes
      </div>
    </div>
  );
}
