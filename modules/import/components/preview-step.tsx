'use client';

import {
  IconCheck,
  IconAlertTriangle,
  IconX,
  IconDownload,
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
  /** Import job ID for error report download */
  importJobId: string | null;
  /** Callback to download error report */
  onDownloadErrorReport?: () => void;
}

/**
 * Step 4: Preview & Validation
 * Shows validation summary before committing the import
 */
export function PreviewStep({
  file,
  summary,
  onDownloadErrorReport,
}: PreviewStepProps) {
  const hasIssues = summary.invalid > 0 || summary.duplicates > 0;

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
        <div className="bg-lightsuccess/20 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <IconCheck size={14} className="text-success" />
            <p className="text-xs text-success">Valides</p>
          </div>
          <p className="text-xl font-bold text-success">
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

        {/* Duplicates */}
        <div className={`rounded-lg p-3 text-center ${summary.duplicates > 0 ? 'bg-lightwarning/20' : 'bg-muted dark:bg-darkmuted'}`}>
          <div className="flex items-center justify-center gap-1 mb-1">
            <IconAlertTriangle size={14} className={summary.duplicates > 0 ? 'text-warning' : 'text-darklink'} />
            <p className={`text-xs ${summary.duplicates > 0 ? 'text-warning' : 'text-darklink'}`}>Doublons</p>
          </div>
          <p className={`text-xl font-bold ${summary.duplicates > 0 ? 'text-warning' : 'text-darklink'}`}>
            {summary.duplicates.toLocaleString('fr-FR')}
          </p>
        </div>
      </div>

      {/* Import confirmation message */}
      <div className={`p-4 rounded-lg ${hasIssues ? 'bg-lightwarning/20 border border-warning/30' : 'bg-lightsuccess/20 border border-success/30'}`}>
        <div className="flex items-start gap-3">
          {hasIssues ? (
            <IconAlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          ) : (
            <IconCheck className="w-5 h-5 text-success shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={`font-medium ${hasIssues ? 'text-warning' : 'text-success'}`}>
              {hasIssues
                ? `${summary.valid.toLocaleString('fr-FR')} leads valides seront importes (${(summary.invalid + summary.duplicates).toLocaleString('fr-FR')} ignores)`
                : `${summary.valid.toLocaleString('fr-FR')} leads prets a etre importes`}
            </p>
            <p className={`text-sm mt-1 ${hasIssues ? 'text-warning/80' : 'text-success/80'}`}>
              {hasIssues
                ? 'Les lignes invalides et les doublons seront ignores lors de l\'import.'
                : 'Toutes les lignes ont ete validees avec succes.'}
            </p>
          </div>
        </div>
      </div>

      {/* Download error report button - only show if there are issues */}
      {hasIssues && onDownloadErrorReport && (
        <button
          onClick={onDownloadErrorReport}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm bg-muted dark:bg-darkmuted text-darklink hover:text-ld hover:bg-border rounded-lg transition-colors"
        >
          <IconDownload size={18} />
          Telecharger le rapport d&apos;erreurs
        </button>
      )}

      {/* File info */}
      <div className="text-center text-sm text-darklink">
        {file.name} • {file.rowCount.toLocaleString('fr-FR')} lignes
      </div>
    </div>
  );
}
