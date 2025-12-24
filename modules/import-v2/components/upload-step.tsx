/**
 * Upload Step Component (Step 1)
 *
 * File upload with drag & drop + column mapping
 */

'use client';

import { useCallback, useState, useRef } from 'react';
import {
  IconUpload,
  IconX,
  IconCheck,
  IconAlertCircle,
  IconChevronRight,
} from '@tabler/icons-react';
import { CardBox, Spinner } from '@/modules/shared';
import { Button } from '@/components/ui/button';
import { FILE_CONSTRAINTS } from '../config/constants';
import { InlineDropdown, type InlineDropdownOptionGroup } from '@/modules/shared';
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
  /** Is currently checking duplicates (transitioning to preview) */
  isCheckingDuplicates?: boolean;
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

/** Grouped field options for dropdown */
const FIELD_OPTION_GROUPS: InlineDropdownOptionGroup[] = [
  {
    label: '',
    options: [{ value: '', label: 'Ignorer' }],
  },
  {
    label: 'Contact',
    options: [
      { value: 'email', label: 'Email' },
      { value: 'phone', label: 'Téléphone' },
      { value: 'external_id', label: 'ID externe' },
    ],
  },
  {
    label: 'Identité',
    options: [
      { value: 'first_name', label: 'Prénom' },
      { value: 'last_name', label: 'Nom' },
      { value: 'company', label: 'Société' },
      { value: 'job_title', label: 'Fonction' },
    ],
  },
  {
    label: 'Localisation',
    options: [
      { value: 'address', label: 'Adresse' },
      { value: 'city', label: 'Ville' },
      { value: 'postal_code', label: 'Code postal' },
      { value: 'country', label: 'Pays' },
    ],
  },
  {
    label: 'Autre',
    options: [
      { value: 'status', label: 'Statut' },
      { value: 'source', label: 'Source' },
      { value: 'notes', label: 'Notes' },
    ],
  },
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
    <div className="flex items-center justify-between p-3 rounded-lg border border-border dark:border-darkborder bg-white dark:bg-dark">
      <div className="flex items-center gap-3">
        <span className="px-2 py-1 text-xs font-medium rounded bg-lightgray dark:bg-darkgray text-darklink">
          {file.type.toUpperCase()}
        </span>
        <span className="text-sm text-ld">{file.name}</span>
        <span className="text-xs text-darklink">
          {file.rowCount.toLocaleString('fr-FR')} lignes · {sizeDisplay}
        </span>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="p-1.5 text-darklink hover:text-error transition-colors"
        title="Supprimer"
      >
        <IconX size={18} />
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
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-lightgray dark:bg-darkgray">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-darklink border-b border-ld">
              Colonne
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-darklink border-b border-ld w-44">
              Champ cible
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-darklink border-b border-ld">
              Exemples
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-dark divide-y divide-border dark:divide-darkborder">
          {mappings.map((mapping) => (
            <tr key={mapping.sourceIndex} className="hover:bg-lighthover dark:hover:bg-darkgray">
              <td className="px-3 py-2 text-sm text-ld">
                {mapping.sourceColumn}
              </td>
              <td className="px-3 py-2">
                <InlineDropdown
                  groups={FIELD_OPTION_GROUPS}
                  value={mapping.targetField || ''}
                  onChange={(v) =>
                    onMappingChange(
                      mapping.sourceIndex,
                      v ? (v as LeadFieldKey) : null
                    )
                  }
                  widthClass="w-full"
                  placeholder="Ignorer"
                />
              </td>
              <td className="px-3 py-2 text-xs text-darklink truncate max-w-xs">
                {mapping.sampleValues.slice(0, 3).filter(Boolean).join(', ') || (
                  <em className="text-darklink/50">vide</em>
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
    <div className="flex items-center justify-between text-sm">
      <span className="text-darklink">
        {mapped.length} colonnes mappées, {ignored.length} ignorées
      </span>
      {hasContactField ? (
        <span className="flex items-center gap-1 text-success">
          <IconCheck size={14} />
          Contact détecté
        </span>
      ) : (
        <span className="flex items-center gap-1 text-error">
          <IconAlertCircle size={14} />
          Email, téléphone ou ID requis
        </span>
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
  isCheckingDuplicates = false,
  parseError,
  onFileSelect,
  onFileClear,
  onMappingChange,
  onNext,
  canProceed,
}: UploadStepProps) {
  const isProcessing = isParsing || isCheckingDuplicates;
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

          <div className="mt-4 border border-border dark:border-darkborder rounded-lg overflow-visible">
            <MappingTable mappings={mapping.mappings} onMappingChange={onMappingChange} />
          </div>
        </CardBox>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end">
        <Button
          onClick={onNext}
          disabled={!canProceed || isProcessing}
          className="gap-2"
        >
          {isCheckingDuplicates ? (
            <>
              <Spinner size="sm" />
              Analyse en cours...
            </>
          ) : (
            <>
              Continuer
              <IconChevronRight size={18} />
            </>
          )}
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
