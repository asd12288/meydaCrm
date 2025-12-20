'use client';

import { useMemo } from 'react';
import {
  IconFileSpreadsheet,
  IconFile,
  IconX,
  IconCheck,
  IconArrowRight,
  IconRefresh,
} from '@tabler/icons-react';
import { FileDropzone } from '../ui/file-dropzone';
import type { UploadedFile, ColumnMappingConfig, LeadFieldKey } from '../types';
import { getAvailableTargetFields, checkRequiredMappings, getMappingSummary } from '../lib/auto-mapper';

interface UploadStepProps {
  file: UploadedFile | null;
  mapping: ColumnMappingConfig | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  onUpdateMapping: (sourceIndex: number, targetField: LeadFieldKey | null) => void;
  onResetMapping: () => void;
  error: string | null;
}

export function UploadStep({
  file,
  mapping,
  onFileSelect,
  onClear,
  onUpdateMapping,
  onResetMapping,
  error,
}: UploadStepProps) {
  const targetFields = useMemo(() => getAvailableTargetFields(), []);

  const mappingCheck = useMemo(() => {
    if (!mapping) return null;
    return checkRequiredMappings(mapping.mappings);
  }, [mapping]);

  const summary = useMemo(() => {
    if (!mapping) return null;
    return getMappingSummary(mapping.mappings);
  }, [mapping]);

  return (
    <div className="space-y-6">
      {/* Dropzone or file info */}
      {!file ? (
        <FileDropzone
          onFileSelect={onFileSelect}
          selectedFile={null}
          onClear={onClear}
          onError={(err) => console.error(err)}
        />
      ) : (
        <>
          {/* Compact file info badge */}
          <div className="flex items-center justify-between p-3 bg-muted dark:bg-darkmuted rounded-lg">
            <div className="flex items-center gap-3">
              {file.type === 'csv' ? (
                <IconFile className="w-6 h-6 text-success" />
              ) : (
                <IconFileSpreadsheet className="w-6 h-6 text-success" />
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
            <button
              type="button"
              onClick={onClear}
              className="p-1.5 text-darklink hover:text-error hover:bg-lighterror/30 rounded-md transition-colors"
              title="Supprimer le fichier"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>

          {/* Excel file message */}
          {file.type !== 'csv' && !mapping && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-ld">
                <span className="font-medium">Fichier Excel detecte.</span>{' '}
                Cliquez sur "Suivant" pour telecharger et analyser le fichier.
              </p>
            </div>
          )}

          {/* Mapping section */}
          {mapping && (
            <div className="space-y-4">
              {/* Header with status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-ld">Mapping des colonnes</h4>
                  {summary && (
                    <span
                      className={`text-sm ${
                        mappingCheck?.isComplete ? 'text-success' : 'text-warning'
                      }`}
                    >
                      {summary.mappedColumns}/{summary.totalColumns} mappees
                      {mappingCheck?.isComplete && (
                        <IconCheck className="w-4 h-4 inline ml-1" />
                      )}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onResetMapping}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-darklink hover:text-ld hover:bg-muted rounded-md transition-colors"
                >
                  <IconRefresh className="w-3.5 h-3.5" />
                  Reinitialiser
                </button>
              </div>

              {/* Warning if no contact field mapped */}
              {mappingCheck && !mappingCheck.isComplete && (
                <div className="flex items-center gap-2 p-3 bg-lightwarning/30 border border-warning/30 rounded-lg text-sm text-warning">
                  <IconCheck className="w-4 h-4" />
                  Mappez au moins un champ de contact (email, telephone ou ID externe)
                </div>
              )}

              {/* Mapping table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted dark:bg-darkmuted">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-darklink uppercase tracking-wider border-b border-border">
                        Colonne du fichier
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-darklink border-b border-border w-10">

                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-darklink uppercase tracking-wider border-b border-border">
                        Champ lead
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mapping.mappings.map((col) => {
                      const isMapped = col.targetField !== null;

                      return (
                        <tr
                          key={col.sourceIndex}
                          className={`${
                            isMapped
                              ? 'bg-lightsuccess/10'
                              : 'hover:bg-lighthover dark:hover:bg-darkmuted/50'
                          }`}
                        >
                          <td className="px-4 py-2.5 border-b border-border">
                            <span className={isMapped ? 'text-ld' : 'text-darklink'}>
                              {col.sourceColumn}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 border-b border-border text-center">
                            <IconArrowRight
                              className={`w-4 h-4 mx-auto ${
                                isMapped ? 'text-success' : 'text-darklink/30'
                              }`}
                            />
                          </td>
                          <td className="px-4 py-2.5 border-b border-border">
                            <select
                              value={col.targetField || ''}
                              onChange={(e) =>
                                onUpdateMapping(
                                  col.sourceIndex,
                                  e.target.value ? (e.target.value as LeadFieldKey) : null
                                )
                              }
                              className={`w-full px-2 py-1.5 rounded-md border text-sm bg-white dark:bg-dark focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                                isMapped
                                  ? 'border-success/50 text-success'
                                  : 'border-border text-darklink'
                              }`}
                            >
                              <option value="">-- Ignorer --</option>
                              {targetFields.map((field) => (
                                <option key={field.value} value={field.value}>
                                  {field.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
