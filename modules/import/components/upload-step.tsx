'use client';

import {
  IconFileSpreadsheet,
  IconFile,
  IconX,
  IconCheck,
  IconLoader2,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { FileDropzone } from '../ui/file-dropzone';
import type { UploadedFile, ColumnMappingConfig, LeadFieldKey } from '../types';
import { checkRequiredMappings, getMappingSummary } from '../lib/auto-mapper';

interface UploadStepProps {
  file: UploadedFile | null;
  mapping: ColumnMappingConfig | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  onUpdateMapping: (sourceIndex: number, targetField: LeadFieldKey | null) => void;
  onResetMapping: () => void;
  error: string | null;
  isProcessing?: boolean;
  conversionProgress?: number;
}

export function UploadStep({
  file,
  mapping,
  onFileSelect,
  onClear,
  isProcessing = false,
  conversionProgress = 0,
}: UploadStepProps) {
  // Show loading during file processing or when conversion is in progress
  const showFileProcessing = isProcessing || (conversionProgress > 0 && conversionProgress < 100);

  // Get mapping summary for display
  const summary = mapping ? getMappingSummary(mapping.mappings) : null;
  const mappingCheck = mapping ? checkRequiredMappings(mapping.mappings) : null;

  return (
    <div className="space-y-6">
      {/* Loading state during file processing */}
      {showFileProcessing && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <IconLoader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-ld text-sm mb-1">
                {conversionProgress > 0 && conversionProgress < 100
                  ? 'Analyse du fichier...'
                  : 'Traitement en cours...'}
              </p>

              {/* Progress bar */}
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${conversionProgress || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dropzone or file info */}
      {!file ? (
        <FileDropzone
          onFileSelect={onFileSelect}
          selectedFile={null}
          onClear={onClear}
          onError={(err) => console.error(err)}
        />
      ) : (
        <div className="space-y-4">
          {/* Compact file info badge */}
          <div className="flex items-center justify-between p-4 bg-muted dark:bg-darkmuted rounded-lg">
            <div className="flex items-center gap-3">
              {file.type === 'csv' ? (
                <IconFile className="w-6 h-6 text-primary" />
              ) : (
                <IconFileSpreadsheet className="w-6 h-6 text-primary" />
              )}
              <div>
                <span className="font-medium text-ld">{file.name}</span>
                <span className="text-darklink mx-2">•</span>
                {file.rowCount > 0 ? (
                  <>
                    <span className="text-darklink">
                      {file.rowCount.toLocaleString('fr-FR')} lignes
                    </span>
                    <span className="text-darklink mx-2">•</span>
                    <span className="text-darklink">{file.headers.length} colonnes</span>
                  </>
                ) : (
                  <span className="text-darklink">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghostDanger"
              size="iconSm"
              onClick={onClear}
              title="Supprimer le fichier"
            >
              <IconX className="w-4 h-4" />
            </Button>
          </div>

          {/* Excel file message */}
          {file.type !== 'csv' && !mapping && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-ld">
                <span className="font-medium">Fichier Excel detecte.</span>{' '}
                Cliquez sur &quot;Suivant&quot; pour telecharger et analyser le fichier.
              </p>
            </div>
          )}

          {/* Auto-mapping status (brief summary, no full table) */}
          {mapping && summary && (
            <div className={`flex items-center gap-3 p-4 rounded-lg ${
              mappingCheck?.isComplete
                ? 'bg-lightsuccess/20 border border-success/30'
                : 'bg-lightwarning/20 border border-warning/30'
            }`}>
              {mappingCheck?.isComplete ? (
                <IconCheck className="w-5 h-5 text-success flex-shrink-0" />
              ) : (
                <IconLoader2 className="w-5 h-5 text-warning flex-shrink-0" />
              )}
              <div>
                <p className={`font-medium ${mappingCheck?.isComplete ? 'text-success' : 'text-warning'}`}>
                  {summary.mappedColumns}/{summary.totalColumns} colonnes auto-detectees
                </p>
                <p className={`text-sm ${mappingCheck?.isComplete ? 'text-success/80' : 'text-warning/80'}`}>
                  {mappingCheck?.isComplete
                    ? 'Cliquez sur "Suivant" pour verifier le mapping'
                    : 'Cliquez sur "Suivant" pour configurer le mapping manuellement'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
