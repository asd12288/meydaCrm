'use client';

import { useMemo, useState } from 'react';
import {
  IconArrowRight,
  IconCheck,
  IconRefresh,
  IconAlertTriangle,
  IconInfoCircle,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import type { ColumnMappingConfig, LeadFieldKey, UploadedFile, RawRow } from '../types';
import { getAvailableTargetFields, checkRequiredMappings, getMappingSummary } from '../lib/auto-mapper';

interface MappingStepProps {
  /** Uploaded file info */
  file: UploadedFile;
  /** Current column mapping configuration */
  mapping: ColumnMappingConfig;
  /** Sample rows for preview */
  sampleRows: RawRow[];
  /** Callback when a column mapping is updated */
  onUpdateMapping: (sourceIndex: number, targetField: LeadFieldKey | null) => void;
  /** Callback to reset all mappings to auto-detected values */
  onResetMapping: () => void;
  /** Whether the mapping is complete (at least one contact field mapped) */
  isComplete: boolean;
}

/**
 * Step 2: Column Mapping
 * Allows users to map file columns to lead fields with sample data preview
 */
export function MappingStep({
  file,
  mapping,
  sampleRows,
  onUpdateMapping,
  onResetMapping,
  isComplete,
}: MappingStepProps) {
  const [expandedColumn, setExpandedColumn] = useState<number | null>(null);
  const targetFields = useMemo(() => getAvailableTargetFields(), []);

  // Check required mappings (for validation badge, even though not directly used in render)
  useMemo(() => {
    return checkRequiredMappings(mapping.mappings);
  }, [mapping]);

  const summary = useMemo(() => {
    return getMappingSummary(mapping.mappings);
  }, [mapping]);

  // Get used target fields to prevent duplicate mapping
  const usedTargetFields = useMemo(() => {
    return new Set(
      mapping.mappings
        .filter((m) => m.targetField !== null)
        .map((m) => m.targetField)
    );
  }, [mapping]);

  // Get sample value for a column
  const getSampleValues = (sourceIndex: number): string[] => {
    return sampleRows.slice(0, 3).map((row) => row.values[sourceIndex] || '-');
  };

  return (
    <div className="space-y-6">
      {/* Header with status */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-ld">Associer les colonnes</h3>
          <p className="text-sm text-darklink mt-1">
            Associez chaque colonne de votre fichier a un champ lead
          </p>
        </div>

        <div className="flex items-center gap-4">
          {summary && (
            <div
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
                ${isComplete ? 'bg-lightsuccess/30 text-success' : 'bg-lightwarning/30 text-warning'}
              `}
            >
              {isComplete ? (
                <IconCheck size={16} />
              ) : (
                <IconAlertTriangle size={16} />
              )}
              {summary.mappedColumns}/{summary.totalColumns} mappees
            </div>
          )}

          <button
            type="button"
            onClick={onResetMapping}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-darklink hover:text-ld hover:bg-muted rounded-lg transition-colors"
          >
            <IconRefresh size={16} />
            Auto-detection
          </button>
        </div>
      </div>

      {/* Warning if no contact field mapped */}
      {!isComplete && (
        <div className="flex items-start gap-3 p-4 bg-lightwarning/20 border border-warning/30 rounded-lg">
          <IconAlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning">Mapping incomplet</p>
            <p className="text-sm text-warning/80 mt-1">
              Mappez au moins un champ de contact:{' '}
              <strong>email</strong>, <strong>telephone</strong> ou <strong>ID externe</strong>
            </p>
          </div>
        </div>
      )}

      {/* Mapping cards */}
      <div className="space-y-3">
        {mapping.mappings.map((col) => {
          const isMapped = col.targetField !== null;
          const isExpanded = expandedColumn === col.sourceIndex;
          const samples = getSampleValues(col.sourceIndex);
          const isAutoMapped = col.confidence > 0.5 && !col.isManual;

          return (
            <div
              key={col.sourceIndex}
              className={`
                border rounded-lg overflow-hidden transition-all
                ${isMapped ? 'border-success/30 bg-lightsuccess/5' : 'border-border'}
              `}
            >
              {/* Main row */}
              <div className="flex items-center gap-4 p-4">
                {/* Source column */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium truncate ${isMapped ? 'text-ld' : 'text-darklink'}`}>
                      {col.sourceColumn}
                    </span>
                    {isAutoMapped && (
                      <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        Auto
                      </span>
                    )}
                  </div>
                  {/* Sample preview */}
                  <p className="text-xs text-darklink mt-1 truncate">
                    Ex: {samples[0] || '-'}
                  </p>
                </div>

                {/* Arrow */}
                <IconArrowRight
                  className={`w-5 h-5 flex-shrink-0 ${isMapped ? 'text-success' : 'text-darklink/30'}`}
                />

                {/* Target field selector */}
                <div className="w-48">
                  <select
                    value={col.targetField || ''}
                    onChange={(e) =>
                      onUpdateMapping(
                        col.sourceIndex,
                        e.target.value ? (e.target.value as LeadFieldKey) : null
                      )
                    }
                    className={`
                      w-full px-3 py-2 rounded-lg border text-sm
                      bg-white dark:bg-dark
                      focus:outline-none focus:ring-2 focus:ring-primary/50
                      ${isMapped ? 'border-success/50 text-success font-medium' : 'border-border text-darklink'}
                    `}
                  >
                    <option value="">-- Ignorer --</option>
                    {targetFields.map((field) => {
                      const isUsed = usedTargetFields.has(field.value) && col.targetField !== field.value;
                      return (
                        <option
                          key={field.value}
                          value={field.value}
                          disabled={isUsed}
                          className={isUsed ? 'text-darklink/50' : ''}
                        >
                          {field.label} {isUsed ? '(deja utilise)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Expand button */}
                <button
                  type="button"
                  onClick={() => setExpandedColumn(isExpanded ? null : col.sourceIndex)}
                  className="p-2 text-darklink hover:text-ld hover:bg-muted rounded-lg transition-colors"
                  title="Voir plus d'exemples"
                >
                  {isExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                </button>
              </div>

              {/* Expanded sample values */}
              {isExpanded && (
                <div className="border-t border-border bg-muted/50 dark:bg-darkmuted/50 px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <IconInfoCircle size={14} className="text-darklink" />
                    <span className="text-xs font-medium text-darklink">
                      Exemples de valeurs ({Math.min(3, sampleRows.length)} premieres lignes)
                    </span>
                  </div>
                  <div className="space-y-1">
                    {samples.map((value, idx) => (
                      <div
                        key={idx}
                        className="text-sm text-ld bg-white dark:bg-dark px-3 py-1.5 rounded border border-border"
                      >
                        {value || <span className="text-darklink italic">vide</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* File info summary */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 dark:bg-darkmuted/50 rounded-lg text-sm">
        <div className="flex items-center gap-2 text-darklink">
          <span className="font-medium text-ld">{file.name}</span>
          <span>•</span>
          <span>{file.rowCount.toLocaleString('fr-FR')} lignes</span>
          <span>•</span>
          <span>{file.headers.length} colonnes</span>
        </div>
      </div>
    </div>
  );
}
