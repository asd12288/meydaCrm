'use client';

import {
  IconCheck,
  IconX,
  IconLoader2,
  IconFileCheck,
  IconUserPlus,
} from '@tabler/icons-react';
import type { ImportProgress } from '../types';

interface ProgressStepProps {
  progress: ImportProgress;
  fileName?: string;
}

export function ProgressStep({ progress, fileName }: ProgressStepProps) {
  // Phase-aware percentage calculation
  // - Parsing: 0-50% (based on chunks processed)
  // - Importing: 50-100% (based on rows imported)
  const { percentage, isIndeterminate } = (() => {
    // Parsing phase: 0-50%
    if (progress.phase === 'parsing') {
      const totalChunks = progress.totalChunks || 0;
      const currentChunk = progress.currentChunk || 0;

      // If we have chunk estimate, calculate 0-50%
      if (totalChunks > 0) {
        const parsingProgress = Math.min(currentChunk / totalChunks, 1);
        return {
          percentage: Math.round(parsingProgress * 50),
          isIndeterminate: false,
        };
      }

      // No chunk estimate - show indeterminate
      return { percentage: 0, isIndeterminate: true };
    }

    // Importing phase: 50-100%
    if (progress.phase === 'importing') {
      const validRows = progress.validRows || 0;
      const importedRows = progress.importedRows || 0;

      if (validRows > 0) {
        const importingProgress = Math.min(importedRows / validRows, 1);
        return {
          percentage: 50 + Math.round(importingProgress * 50),
          isIndeterminate: false,
        };
      }

      // No valid rows count yet, show 50%
      return { percentage: 50, isIndeterminate: true };
    }

    // Completed
    if (progress.phase === 'completed') {
      return { percentage: 100, isIndeterminate: false };
    }

    // Default
    return { percentage: 0, isIndeterminate: true };
  })();

  const getPhaseLabel = () => {
    if (progress.phase === 'parsing') return 'Validation des données';
    if (progress.phase === 'importing') return 'Création des leads';
    return '';
  };

  const getDetailLabel = () => {
    if (progress.phase === 'parsing') {
      const rows = progress.processedRows || 0;
      if (rows > 0) {
        return `${rows.toLocaleString('fr-FR')} lignes analysées`;
      }
      return 'Analyse en cours...';
    }
    if (progress.phase === 'importing') {
      const imported = progress.importedRows || 0;
      const valid = progress.validRows || 0;
      if (valid > 0) {
        return `${imported.toLocaleString('fr-FR')} / ${valid.toLocaleString('fr-FR')} leads`;
      }
      return 'Préparation de l\'import...';
    }
    return '';
  };

  // Success state
  if (progress.phase === 'completed') {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <IconCheck className="w-8 h-8 text-primary" strokeWidth={2} />
        </div>

        <div className="text-center">
          <h3 className="text-xl font-semibold text-ld mb-1">Import terminé</h3>
          <p className="text-darklink">
            <span className="font-semibold text-primary">
              {progress.importedRows.toLocaleString('fr-FR')}
            </span>{' '}
            leads importés avec succès
          </p>
          {progress.skippedRows > 0 && (
            <p className="text-sm text-darklink mt-1">
              {progress.skippedRows.toLocaleString('fr-FR')} doublons ignorés
            </p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (progress.phase === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
          <IconX className="w-8 h-8 text-error" strokeWidth={2} />
        </div>

        <div className="text-center max-w-md">
          <h3 className="text-xl font-semibold text-ld mb-1">Import échoué</h3>
          {progress.errorMessage && (
            <p className="text-error text-sm">{progress.errorMessage}</p>
          )}
          <p className="text-sm text-darklink mt-2">
            {progress.processedRows.toLocaleString('fr-FR')} lignes traitées avant l&apos;erreur
          </p>
        </div>
      </div>
    );
  }

  // Active import state - two-phase progress display
  // At this point, phase can only be: 'uploading' | 'parsing' | 'validating' | 'importing'
  const isImporting = progress.phase === 'importing';
  const isParsing = progress.phase === 'parsing' || progress.phase === 'validating' || progress.phase === 'uploading';

  return (
    <div className="py-6 space-y-6">
      {/* Phase indicator */}
      <div className="flex justify-center gap-8">
        <div className={`flex items-center gap-2 ${
          isParsing ? 'text-primary' : 'text-darklink'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isParsing
              ? 'bg-primary text-white'
              : isImporting
                ? 'bg-success text-white'
                : 'bg-muted'
          }`}>
            {isImporting ? (
              <IconCheck size={16} />
            ) : (
              <IconFileCheck size={16} />
            )}
          </div>
          <span className="text-sm font-medium">Validation</span>
        </div>

        <div className={`flex items-center gap-2 ${
          isImporting ? 'text-primary' : 'text-darklink'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isImporting
              ? 'bg-primary text-white'
              : 'bg-muted'
          }`}>
            <IconUserPlus size={16} />
          </div>
          <span className="text-sm font-medium">Import</span>
        </div>
      </div>

      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-ld mb-1">
          {getPhaseLabel()}
        </h3>
        {fileName && (
          <p className="text-sm text-darklink">{fileName}</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="max-w-md mx-auto space-y-2">
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          {isIndeterminate ? (
            // Animated indeterminate bar
            <div className="h-full bg-primary w-1/3 animate-indeterminate" />
          ) : (
            // Determinate progress bar
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          )}
        </div>

        {/* Percentage and detail */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-darklink">{getDetailLabel()}</span>
          {!isIndeterminate && (
            <span className="font-semibold text-primary">{percentage}%</span>
          )}
        </div>
      </div>

      {/* Spinner */}
      <div className="flex justify-center">
        <IconLoader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    </div>
  );
}
