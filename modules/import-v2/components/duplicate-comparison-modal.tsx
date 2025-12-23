/**
 * Duplicate Comparison Modal
 *
 * Side-by-side comparison of file data vs existing lead data
 */

'use client';

import { IconArrowRight, IconCheck, IconDatabase } from '@tabler/icons-react';
import { Modal, Badge } from '@/modules/shared';
import { Button } from '@/components/ui/button';
import type { ComparisonDataV2 } from '../types/preview';
import type { DuplicateStrategyV2 } from '../config/constants';

// =============================================================================
// TYPES
// =============================================================================

interface DuplicateComparisonModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close modal callback */
  onClose: () => void;
  /** Comparison data */
  data: ComparisonDataV2 | null;
  /** Callback when action is selected */
  onActionSelect: (rowNumber: number, action: DuplicateStrategyV2) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  phone: 'Téléphone',
  firstName: 'Prénom',
  lastName: 'Nom',
  company: 'Société',
  jobTitle: 'Fonction',
  address: 'Adresse',
  city: 'Ville',
  postalCode: 'Code postal',
  country: 'Pays',
  status: 'Statut',
  source: 'Source',
  notes: 'Notes',
  externalId: 'ID externe',
};

// Map from file field names to existing lead field names
const FIELD_MAP: Record<string, string> = {
  email: 'email',
  phone: 'phone',
  firstName: 'firstName',
  lastName: 'lastName',
  company: 'company',
  jobTitle: 'jobTitle',
  address: 'address',
  city: 'city',
  postalCode: 'postalCode',
  country: 'country',
  status: 'status',
  source: 'source',
  notes: 'notes',
  externalId: 'externalId',
};

const COMPARISON_FIELDS = [
  'email',
  'phone',
  'firstName',
  'lastName',
  'company',
  'jobTitle',
  'address',
  'city',
  'postalCode',
  'country',
  'externalId',
] as const;

// =============================================================================
// HELPER COMPONENT
// =============================================================================

interface ComparisonRowProps {
  field: string;
  fileValue: string | null | undefined;
  existingValue: string | null | undefined;
  isChanged: boolean;
  isMatchField: boolean;
}

function ComparisonRow({
  field,
  fileValue,
  existingValue,
  isChanged,
  isMatchField,
}: ComparisonRowProps) {
  const displayFileValue = fileValue || '-';
  const displayExistingValue = existingValue || '-';

  return (
    <tr
      className={`
        ${isChanged ? 'bg-warning/5 dark:bg-warning/10' : ''}
        ${isMatchField ? 'bg-primary/5 dark:bg-primary/10' : ''}
      `}
    >
      <td className="px-4 py-2 text-sm font-medium text-ld border-b border-border dark:border-darkborder">
        <div className="flex items-center gap-2">
          {FIELD_LABELS[field] || field}
          {isMatchField && (
            <Badge variant="info" size="sm">
              Clé
            </Badge>
          )}
          {isChanged && !isMatchField && (
            <Badge variant="warning" size="sm">
              Différent
            </Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-2 text-sm text-darklink border-b border-border dark:border-darkborder">
        {displayExistingValue}
      </td>
      <td className="px-4 py-2 text-center border-b border-border dark:border-darkborder">
        {isChanged && <IconArrowRight size={16} className="text-warning mx-auto" />}
      </td>
      <td
        className={`px-4 py-2 text-sm border-b border-border dark:border-darkborder ${
          isChanged ? 'text-warning font-medium' : 'text-darklink'
        }`}
      >
        {displayFileValue}
      </td>
    </tr>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DuplicateComparisonModal({
  isOpen,
  onClose,
  data,
  onActionSelect,
}: DuplicateComparisonModalProps) {
  if (!data) return null;

  const handleAction = (action: DuplicateStrategyV2) => {
    onActionSelect(data.rowNumber, action);
    onClose();
  };

  // Build list of comparison fields
  const comparisonRows = COMPARISON_FIELDS.map((field) => {
    const fileField = field as keyof typeof data.fileData;
    const existingField = FIELD_MAP[field] as keyof typeof data.existingData;

    return {
      field,
      fileValue: data.fileData[fileField] as string | null | undefined,
      existingValue: data.existingData[existingField] as string | null | undefined,
      isChanged: data.changedFields.some(
        (f) => f === field || f === field.replace(/([A-Z])/g, '_$1').toLowerCase()
      ),
      isMatchField: data.matchedField === field ||
        data.matchedField === field.replace(/([A-Z])/g, '_$1').toLowerCase(),
    };
  });

  const modalTitle = `Comparer - Ligne ${data.rowNumber}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={modalTitle}
      icon={<IconDatabase size={20} />}
    >
      <div className="px-1">
        {/* Match Info */}
        <p className="text-sm text-darklink mb-4">
          Correspondance sur{' '}
          <strong>{FIELD_LABELS[data.matchedField] || data.matchedField}</strong>:{' '}
          {data.matchedValue}
        </p>

        {/* Comparison Table */}
        <div className="overflow-x-auto border border-border dark:border-darkborder rounded-lg mb-6">
          <table className="w-full">
            <thead className="bg-lightgray dark:bg-darkgray">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-darklink uppercase tracking-wider border-b border-border dark:border-darkborder">
                  Champ
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-darklink uppercase tracking-wider border-b border-border dark:border-darkborder">
                  Existant
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-darklink uppercase tracking-wider border-b border-border dark:border-darkborder w-12">
                  &nbsp;
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-darklink uppercase tracking-wider border-b border-border dark:border-darkborder">
                  Fichier
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark">
              {comparisonRows.map((row) => (
                <ComparisonRow key={row.field} {...row} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Existing Lead Info */}
        <div className="p-3 bg-lightgray dark:bg-darkgray rounded-lg mb-6">
          <p className="text-xs text-darklink">
            Lead existant créé le{' '}
            {new Date(data.existingData.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            {data.existingData.status && (
              <>
                {' '}
                • Statut:{' '}
                <strong>{data.existingData.statusLabel || data.existingData.status}</strong>
              </>
            )}
          </p>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm text-darklink">
            {data.changedFields.length === 0 ? (
              'Aucun champ différent'
            ) : (
              <>
                <strong>{data.changedFields.length}</strong> champ(s) différent(s)
              </>
            )}
          </span>
          <span className="text-sm text-darklink">
            Action actuelle:{' '}
            <strong>
              {data.rowAction === 'skip' && 'Ignorer'}
              {data.rowAction === 'update' && 'Mettre à jour'}
              {data.rowAction === 'create' && 'Créer nouveau'}
            </strong>
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-border dark:border-darkborder">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAction('skip')}
            className={data.rowAction === 'skip' ? 'ring-2 ring-primary' : ''}
          >
            Ignorer
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleAction('update')}
            className={data.rowAction === 'update' ? 'ring-2 ring-primary' : ''}
          >
            Mettre à jour
          </Button>
          <Button
            onClick={() => handleAction('create')}
            className={data.rowAction === 'create' ? 'ring-2 ring-primary' : ''}
          >
            <IconCheck size={16} className="mr-1" />
            Créer nouveau
          </Button>
        </div>
      </div>
    </Modal>
  );
}
