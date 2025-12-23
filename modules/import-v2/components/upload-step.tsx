/**
 * Upload Step Component (Step 1)
 *
 * File upload with drag & drop + column mapping
 */

'use client';

import { useCallback, useState, useRef } from 'react';
import {
  IconUpload,
  IconFile,
  IconX,
  IconCheck,
  IconAlertCircle,
  IconChevronRight,
} from '@tabler/icons-react';
import { CardBox, Badge, Spinner } from '@/modules/shared';
import { Button } from '@/components/ui/button';
import { FILE_CONSTRAINTS, PROCESSING } from '../config/constants';
import type { ColumnMappingV2, ParsedFileV2, ColumnMappingConfigV2 } from '../types';
import type { LeadFieldKey } from '../../import/types/mapping';

// =============================================================================
// TYPES
// =============================================================================

interface UploadStepProps {
  /** Current parsed file (if any) */
  parsedFile: ParsedFileV2 | null;
  /** Current mapping config */
  mapping: ColumnMappingConfigV2 | null;
  /** Is currently parsing */
  isParsing: boolean;
  /** Parse error message */
  parseError: string | null;
  /** Callback when file is selected */
  onFileSelect: (file: File) => void;
  /** Callback when file is cleared */
  onFileClear: () => void;
  /** Callback when mapping is updated */
  onMappingChange: (sourceIndex: number, targetField: LeadFieldKey | null) => void;
  /** Callback to proceed to next step */
  onNext: () => void;
  /** Whether can proceed to next step */
  canProceed: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const FIELD_OPTIONS: { value: LeadFieldKey | ''; label: string; group: string }[] = [
  { value: '', label: 'Ignorer', group: '' },
  // Contact
  { value: 'email', label: 'Email', group: 'Contact' },
  { value: 'phone', label: 'Téléphone', group: 'Contact' },
  { value: 'external_id', label: 'ID externe', group: 'Contact' },
  // Identity
  { value: 'first_name', label: 'Prénom', group: 'Identité' },
  { value: 'last_name', label: 'Nom', group: 'Identité' },
  { value: 'company', label: 'Société', group: 'Identité' },
  { value: 'job_title', label: 'Fonction', group: 'Identité' },
  // Location
  { value: 'address', label: 'Adresse', group: 'Localisation' },
  { value: 'city', label: 'Ville', group: 'Localisation' },
  { value: 'postal_code', label: 'Code postal', group: 'Localisation' },
  { value: 'country', label: 'Pays', group: 'Localisation' },
  // Other
  { value: 'status', label: 'Statut', group: 'Autre' },
  { value: 'source', label: 'Source', group: 'Autre' },
  { value: 'notes', label: 'Notes', group: 'Autre' },
];

// =============================================================================
// DROP ZONE COMPONENT
// =============================================================================

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  isParsing: boolean;
}

function DropZone({ onFileSelect, isParsing }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
        transition-all duration-200
        ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border dark:border-darkborder hover:border-primary/50 hover:bg-lightgray/50 dark:hover:bg-darkgray/50'
        }
        ${isParsing ? 'pointer-events-none opacity-50' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />

      {isParsing ? (
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-darklink">Analyse du fichier en cours...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-lightprimary dark:bg-primary/10 flex items-center justify-center">
            <IconUpload size={32} className="text-primary" />
          </div>
          <div>
            <p className="text-lg font-medium text-ld">
              Glissez-déposez votre fichier ici
            </p>
            <p className="text-sm text-darklink mt-1">
              ou cliquez pour sélectionner
            </p>
          </div>
          <p className="text-xs text-darklink">
            Formats acceptés: CSV, XLSX, XLS (max {FILE_CONSTRAINTS.MAX_SIZE_MB}MB)
          </p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// FILE INFO COMPONENT
// =============================================================================

interface FileInfoProps {
  file: ParsedFileV2;
  onClear: () => void;
}

function FileInfo({ file, onClear }: FileInfoProps) {
  const sizeKB = Math.round(file.size / 1024);
  const sizeDisplay = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

  return (
    <div className="flex items-center justify-between p-4 bg-lightsuccess/30 dark:bg-success/10 rounded-lg border border-success/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
          <IconFile size={24} className="text-success" />
        </div>
        <div>
          <p className="font-medium text-ld">{file.name}</p>
          <p className="text-xs text-darklink">
            {file.rowCount.toLocaleString('fr-FR')} lignes • {sizeDisplay} •{' '}
            {file.type.toUpperCase()}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="p-2 text-darklink hover:text-error transition-colors"
        title="Supprimer le fichier"
      >
        <IconX size={20} />
      </button>
    </div>
  );
}

// =============================================================================
// MAPPING TABLE COMPONENT
// =============================================================================

interface MappingTableProps {
  mappings: ColumnMappingV2[];
  onMappingChange: (sourceIndex: number, targetField: LeadFieldKey | null) => void;
}

function MappingTable({ mappings, onMappingChange }: MappingTableProps) {
  // Group fields by category for the select dropdown
  const groupedFields = FIELD_OPTIONS.reduce(
    (acc, field) => {
      if (!field.group) {
        acc[''] = acc[''] || [];
        acc[''].push(field);
      } else {
        acc[field.group] = acc[field.group] || [];
        acc[field.group].push(field);
      }
      return acc;
    },
    {} as Record<string, typeof FIELD_OPTIONS>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-lightgray dark:bg-darkgray">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-darklink uppercase tracking-wider border-b border-ld">
              Colonne du fichier
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-darklink uppercase tracking-wider border-b border-ld w-48">
              Mapper vers
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-darklink uppercase tracking-wider border-b border-ld">
              Aperçu
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-darklink uppercase tracking-wider border-b border-ld w-24">
              Confiance
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-dark divide-y divide-border dark:divide-darkborder">
          {mappings.map((mapping) => (
            <tr key={mapping.sourceIndex} className="hover:bg-lighthover dark:hover:bg-darkgray">
              <td className="px-4 py-3 text-sm font-medium text-ld">
                {mapping.sourceColumn}
              </td>
              <td className="px-4 py-3">
                <select
                  value={mapping.targetField || ''}
                  onChange={(e) =>
                    onMappingChange(
                      mapping.sourceIndex,
                      e.target.value ? (e.target.value as LeadFieldKey) : null
                    )
                  }
                  className="select-md text-sm w-full"
                >
                  {Object.entries(groupedFields).map(([group, fields]) =>
                    group ? (
                      <optgroup key={group} label={group}>
                        {fields.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </optgroup>
                    ) : (
                      fields.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))
                    )
                  )}
                </select>
              </td>
              <td className="px-4 py-3 text-sm text-darklink">
                <div className="flex flex-wrap gap-1">
                  {mapping.sampleValues.slice(0, 3).map((val, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-lightgray dark:bg-darkgray rounded text-xs truncate max-w-[120px]"
                      title={val}
                    >
                      {val || <em className="text-darklink/50">vide</em>}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                {mapping.isManual ? (
                  <Badge variant="primary" size="sm">
                    Manuel
                  </Badge>
                ) : mapping.targetField ? (
                  <Badge
                    variant={mapping.confidence >= 0.8 ? 'success' : 'warning'}
                    size="sm"
                  >
                    {Math.round(mapping.confidence * 100)}%
                  </Badge>
                ) : (
                  <span className="text-xs text-darklink">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// MAPPING SUMMARY
// =============================================================================

interface MappingSummaryProps {
  mappings: ColumnMappingV2[];
}

function MappingSummary({ mappings }: MappingSummaryProps) {
  const mapped = mappings.filter((m) => m.targetField !== null);
  const ignored = mappings.filter((m) => m.targetField === null);

  // Check for required fields
  const hasEmail = mapped.some((m) => m.targetField === 'email');
  const hasPhone = mapped.some((m) => m.targetField === 'phone');
  const hasExternalId = mapped.some((m) => m.targetField === 'external_id');
  const hasContactField = hasEmail || hasPhone || hasExternalId;

  return (
    <div className="flex items-center gap-4 p-3 bg-lightgray dark:bg-darkgray rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm text-darklink">Colonnes mappées:</span>
        <Badge variant="primary" size="sm">
          {mapped.length}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-darklink">Ignorées:</span>
        <Badge variant="secondary" size="sm">
          {ignored.length}
        </Badge>
      </div>
      <div className="flex-1" />
      {hasContactField ? (
        <div className="flex items-center gap-1 text-success text-sm">
          <IconCheck size={16} />
          <span>Champ de contact détecté</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-error text-sm">
          <IconAlertCircle size={16} />
          <span>Email, téléphone ou ID externe requis</span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function UploadStep({
  parsedFile,
  mapping,
  isParsing,
  parseError,
  onFileSelect,
  onFileClear,
  onMappingChange,
  onNext,
  canProceed,
}: UploadStepProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* File Upload / Info */}
      <CardBox>
        <h3 className="card-title mb-4">Fichier à importer</h3>

        {parseError && (
          <div className="mb-4 p-3 bg-lighterror/50 dark:bg-error/10 border border-error/30 rounded-lg text-error text-sm">
            <div className="flex items-start gap-2">
              <IconAlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          </div>
        )}

        {!parsedFile ? (
          <DropZone onFileSelect={onFileSelect} isParsing={isParsing} />
        ) : (
          <FileInfo file={parsedFile} onClear={onFileClear} />
        )}
      </CardBox>

      {/* Column Mapping */}
      {parsedFile && mapping && (
        <CardBox>
          <h3 className="card-title mb-4">Mapping des colonnes</h3>
          <p className="text-sm text-darklink mb-4">
            Vérifiez et ajustez le mapping automatique des colonnes vers les champs de leads.
          </p>

          <MappingSummary mappings={mapping.mappings} />

          <div className="mt-4 border border-border dark:border-darkborder rounded-lg overflow-hidden">
            <MappingTable mappings={mapping.mappings} onMappingChange={onMappingChange} />
          </div>
        </CardBox>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end">
        <Button
          onClick={onNext}
          disabled={!canProceed || isParsing}
          className="gap-2"
        >
          Continuer
          <IconChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

export function UploadStepSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <CardBox>
        <div className="h-5 w-40 bg-border dark:bg-darkborder rounded mb-4" />
        <div className="border-2 border-dashed border-border dark:border-darkborder rounded-lg p-12 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-border dark:bg-darkborder" />
          <div className="h-5 w-48 bg-border dark:bg-darkborder rounded" />
          <div className="h-4 w-32 bg-border dark:bg-darkborder rounded" />
        </div>
      </CardBox>
    </div>
  );
}
