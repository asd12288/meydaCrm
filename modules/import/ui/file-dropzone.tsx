'use client';

import { useCallback, useState } from 'react';
import {
  IconUpload,
  IconFile,
  IconFileSpreadsheet,
  IconX,
  IconAlertCircle,
} from '@tabler/icons-react';
import {
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_FILE_EXTENSIONS,
} from '../config/constants';
import { validateFileType, validateFileSize, getFileExtension } from '../lib/parsers';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  selectedFile?: File | null;
  onClear?: () => void;
}

export function FileDropzone({
  onFileSelect,
  onError,
  isLoading = false,
  disabled = false,
  selectedFile,
  onClear,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setError(null);

      // Validate file type
      const typeValidation = validateFileType(file);
      if (!typeValidation.isValid) {
        const errMsg = typeValidation.error || 'Format de fichier non supporte';
        setError(errMsg);
        onError?.(errMsg);
        return;
      }

      // Validate file size
      const sizeValidation = validateFileSize(file, MAX_FILE_SIZE_BYTES);
      if (!sizeValidation.isValid) {
        const errMsg = sizeValidation.error || 'Fichier trop volumineux';
        setError(errMsg);
        onError?.(errMsg);
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect, onError]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !isLoading) {
        setIsDragging(true);
      }
    },
    [disabled, isLoading]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isLoading) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        validateAndSelect(files[0]);
      }
    },
    [disabled, isLoading, validateAndSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        validateAndSelect(files[0]);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [validateAndSelect]
  );

  const handleClear = useCallback(() => {
    setError(null);
    onClear?.();
  }, [onClear]);

  const getFileIcon = (filename: string) => {
    const ext = getFileExtension(filename);
    if (ext === 'csv') {
      return <IconFile className="w-8 h-8 text-primary" />;
    }
    return <IconFileSpreadsheet className="w-8 h-8 text-primary" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Show selected file
  if (selectedFile && !error) {
    return (
      <div className="border-2 border-primary/30 bg-lightprimary/20 rounded-lg p-6">
        <div className="flex items-center gap-4">
          {getFileIcon(selectedFile.name)}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-ld truncate">{selectedFile.name}</p>
            <p className="text-sm text-darklink">
              {formatFileSize(selectedFile.size)} •{' '}
              {getFileExtension(selectedFile.name).toUpperCase()}
            </p>
          </div>
          {onClear && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2 rounded-full hover:bg-lighterror/30 text-darklink hover:text-error transition-colors"
              aria-label="Supprimer le fichier"
            >
              <IconX className="w-5 h-5" />
            </button>
          )}
        </div>
        {isLoading && (
          <div className="mt-4">
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-pulse rounded-full w-1/2" />
            </div>
            <p className="text-sm text-darklink mt-2">Analyse du fichier...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${
            isDragging
              ? 'border-primary bg-lightprimary/20'
              : error
                ? 'border-error/50 bg-lighterror/10'
                : 'border-border hover:border-primary/50 hover:bg-lightprimary/10'
          }
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          accept={ALLOWED_FILE_EXTENSIONS.join(',')}
          onChange={handleFileInput}
          disabled={disabled || isLoading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Selectionner un fichier"
        />

        <div className="flex flex-col items-center gap-3">
          {error ? (
            <IconAlertCircle className="w-12 h-12 text-error" />
          ) : (
            <IconUpload
              className={`w-12 h-12 ${isDragging ? 'text-primary' : 'text-darklink'}`}
            />
          )}

          <div>
            <p className="font-medium text-ld">
              {isDragging
                ? 'Deposez le fichier ici'
                : 'Glissez-deposez un fichier ou cliquez pour parcourir'}
            </p>
            <p className="text-sm text-darklink mt-1">
              Formats acceptes: CSV, XLSX, XLS • Max {MAX_FILE_SIZE_MB} MB
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-error text-sm">
          <IconAlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
