'use client';

import {
  IconFileSpreadsheet,
  IconFile,
  IconX,
} from '@tabler/icons-react';
import { Button, Spinner } from '@/modules/shared';
import { FileDropzone } from '../ui/file-dropzone';
import type { UploadedFile } from '../types';

interface UploadStepProps {
  file: UploadedFile | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  error: string | null;
  isProcessing?: boolean;
  conversionProgress?: number;
}

export function UploadStep({
  file,
  onFileSelect,
  onClear,
  isProcessing = false,
  conversionProgress = 0,
}: UploadStepProps) {
  // Show loading during file processing or when conversion is in progress
  const showFileProcessing = isProcessing || (conversionProgress > 0 && conversionProgress < 100);

  return (
    <div className="space-y-6">
      {/* Loading state during file processing */}
      {showFileProcessing && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Spinner size="md" className="flex-shrink-0 mt-0.5" />
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

        </div>
      )}
    </div>
  );
}
