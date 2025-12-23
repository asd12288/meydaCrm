'use client';

import { useMemo } from 'react';
import { IconRefresh, IconAlertTriangle } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/modules/shared';
import type { ColumnMappingConfig, LeadFieldKey, UploadedFile, RawRow } from '../types';
import { getAvailableTargetFields, getMappingSummary } from '../lib/auto-mapper';

interface MappingStepProps {
  file: UploadedFile;
  mapping: ColumnMappingConfig;
  sampleRows: RawRow[];
  onUpdateMapping: (sourceIndex: number, targetField: LeadFieldKey | null) => void;
  onResetMapping: () => void;
  isComplete: boolean;
}

/**
 * Step 2: Column Mapping - Table-based compact layout
 */
export function MappingStep({
  file,
  mapping,
  sampleRows,
  onUpdateMapping,
  onResetMapping,
  isComplete,
}: MappingStepProps) {
  const targetFields = useMemo(() => getAvailableTargetFields(), []);
  const summary = useMemo(() => getMappingSummary(mapping.mappings), [mapping]);

  const usedTargetFields = useMemo(() => {
    return new Set(
      mapping.mappings
        .filter((m) => m.targetField !== null)
        .map((m) => m.targetField)
    );
  }, [mapping]);

  // Get sample values with fill rate
  const getColumnStats = (sourceIndex: number) => {
    const values = sampleRows.map((row) => row.values[sourceIndex]?.trim() || '');
    const filled = values.filter((v) => v.length > 0);
    const samples = filled.slice(0, 3);
    const fillRate = sampleRows.length > 0 ? Math.round((filled.length / sampleRows.length) * 100) : 0;
    return { samples, fillRate };
  };

  // Truncate sample for display
  const truncateSample = (value: string, maxLen = 24) => {
    if (!value) return '';
    return value.length > maxLen ? value.slice(0, maxLen) + '…' : value;
  };

  // Split into mapped and unmapped
  const mappedColumns = mapping.mappings.filter((m) => m.targetField !== null);
  const unmappedColumns = mapping.mappings.filter((m) => m.targetField === null);

  return (
    <div className="space-y-4">
      {/* Compact header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-ld">Mapping</h3>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isComplete
                ? 'bg-lightsuccess text-success'
                : 'bg-lightwarning text-warning'
            }`}
          >
            {summary?.mappedColumns || 0}/{summary?.totalColumns || 0}
          </span>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onResetMapping}>
          <IconRefresh size={14} />
          Reset
        </Button>
      </div>

      {/* Warning banner - compact */}
      {!isComplete && (
        <div className="flex items-center gap-2 px-3 py-2 bg-lightwarning/30 border border-warning/20 rounded text-xs text-warning">
          <IconAlertTriangle size={14} />
          <span>Mappez au moins: <strong>email</strong>, <strong>telephone</strong> ou <strong>ID externe</strong></span>
        </div>
      )}

      {/* Mapping table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 dark:bg-darkmuted/50 border-b border-border">
              <th className="text-left px-3 py-2 font-medium text-darklink w-[30%]">Colonne source</th>
              <th className="text-left px-3 py-2 font-medium text-darklink w-[35%]">Aperçu</th>
              <th className="text-left px-3 py-2 font-medium text-darklink w-[35%]">Champ cible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {/* Mapped columns first */}
            {mappedColumns.map((col) => {
              const { samples, fillRate } = getColumnStats(col.sourceIndex);

              return (
                <tr key={col.sourceIndex} className="bg-lightsuccess/5 hover:bg-lightsuccess/10 transition-colors">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                      <span className="font-medium text-ld truncate" title={col.sourceColumn}>
                        {col.sourceColumn}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-darklink truncate" title={samples.join(', ')}>
                        {samples.length > 0 ? truncateSample(samples[0]) : <em className="text-darklink/50">vide</em>}
                        {samples.length > 1 && <span className="text-darklink/50">, {truncateSample(samples[1])}</span>}
                      </span>
                      {fillRate < 100 && (
                        <span className="text-[10px] text-darklink/60 shrink-0">{fillRate}%</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={col.targetField || ''}
                      onChange={(e) =>
                        onUpdateMapping(col.sourceIndex, e.target.value ? (e.target.value as LeadFieldKey) : null)
                      }
                      placeholder="Ignorer"
                      selectSize="sm"
                      options={targetFields.map((field) => ({
                        value: field.value,
                        label: field.label,
                        disabled: usedTargetFields.has(field.value) && col.targetField !== field.value,
                      }))}
                    />
                  </td>
                </tr>
              );
            })}

            {/* Unmapped columns */}
            {unmappedColumns.length > 0 && mappedColumns.length > 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-1.5 bg-muted/30 dark:bg-darkmuted/30">
                  <span className="text-xs text-darklink">Colonnes ignorées ({unmappedColumns.length})</span>
                </td>
              </tr>
            )}
            {unmappedColumns.map((col) => {
              const { samples, fillRate } = getColumnStats(col.sourceIndex);

              return (
                <tr key={col.sourceIndex} className="hover:bg-muted/30 transition-colors opacity-70">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-darklink/30 shrink-0" />
                      <span className="text-darklink truncate" title={col.sourceColumn}>
                        {col.sourceColumn}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-darklink/70 truncate" title={samples.join(', ')}>
                        {samples.length > 0 ? truncateSample(samples[0]) : <em className="text-darklink/50">vide</em>}
                      </span>
                      {fillRate < 100 && (
                        <span className="text-[10px] text-darklink/50 shrink-0">{fillRate}%</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value=""
                      onChange={(e) =>
                        onUpdateMapping(col.sourceIndex, e.target.value ? (e.target.value as LeadFieldKey) : null)
                      }
                      placeholder="Ignorer"
                      selectSize="sm"
                      options={targetFields.map((field) => ({
                        value: field.value,
                        label: field.label,
                        disabled: usedTargetFields.has(field.value),
                      }))}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* File summary - compact */}
      <div className="flex items-center gap-3 text-xs text-darklink">
        <span className="font-medium text-ld">{file.name}</span>
        <span>•</span>
        <span>{file.rowCount.toLocaleString('fr-FR')} lignes</span>
        <span>•</span>
        <span>{file.headers.length} colonnes</span>
        {file.rowCount > 100 && (
          <>
            <span>•</span>
            <span className="text-darklink/60">Aperçu: 100 premières lignes</span>
          </>
        )}
      </div>
    </div>
  );
}
