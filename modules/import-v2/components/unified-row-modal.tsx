/**
 * Unified Row Modal Component
 *
 * Single modal that adapts based on issue type:
 * - Invalid: Shows errors + editable fields
 * - File duplicate: Shows duplicate info + editable fields
 * - Database duplicate: Shows comparison + editable fields
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  IconCopy,
  IconDatabase,
  IconCheck,
} from '@tabler/icons-react';
import { Modal, InlineDropdown } from '@/modules/shared';
import { Button } from '@/components/ui/button';
import type { LeadFieldKey } from '../../import/types/mapping';
import type {
  UnifiedRowAction,
  PreviewIssueType,
  DuplicateCheckField,
} from '../config/constants';
import {
  AVAILABLE_ACTIONS_BY_TYPE,
  UNIFIED_ROW_ACTION_LABELS,
  PREVIEW_ISSUE_LABELS,
} from '../config/constants';
import type { InvalidRowV2, FileDuplicateRowV2, DbDuplicateRowV2, ExistingLeadDataV2 } from '../types/preview';
import type { ColumnMappingV2 } from '../types';

// =============================================================================
// TYPES
// =============================================================================

interface UnifiedRowModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** Issue type determines layout */
  issueType: PreviewIssueType;
  /** Row number */
  rowNumber: number;
  /** Row data (varies by issue type) */
  row: InvalidRowV2 | FileDuplicateRowV2 | DbDuplicateRowV2;
  /** Current action */
  currentAction: UnifiedRowAction;
  /** Current edits */
  currentEdits: Partial<Record<LeadFieldKey, string>>;
  /** Column mappings */
  mappings: ColumnMappingV2[];
  /** Action change callback */
  onActionChange: (action: UnifiedRowAction) => void;
  /** Save edits callback */
  onSave: (edits: Partial<Record<LeadFieldKey, string>>) => void;
}

// =============================================================================
// FIELD LABELS
// =============================================================================

const FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  phone: 'Téléphone',
  first_name: 'Prénom',
  last_name: 'Nom',
  company: 'Société',
  job_title: 'Fonction',
  address: 'Adresse',
  city: 'Ville',
  postal_code: 'Code postal',
  country: 'Pays',
  source: 'Source',
  notes: 'Notes',
  status: 'Statut',
  external_id: 'ID externe',
};

// =============================================================================
// REAL-TIME VALIDATION
// =============================================================================

/**
 * Validate current field values and return remaining errors
 */
function validateCurrentValues(
  values: Partial<Record<LeadFieldKey, string>>
): Map<LeadFieldKey, string> {
  const errors = new Map<LeadFieldKey, string>();

  // Check email format if provided
  const email = values.email?.trim();
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.set('email', 'Format email invalide');
    }
  }

  // Check phone length if provided
  const phone = values.phone?.trim();
  if (phone) {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (cleanPhone.length < 8) {
      errors.set('phone', 'Numéro de téléphone trop court');
    }
  }

  // Check for at least one contact field
  const hasContact = (email && email.length > 0) || (phone && phone.length > 0);
  if (!hasContact) {
    errors.set('email', 'Au moins un champ de contact requis (email ou téléphone)');
  }

  return errors;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface FieldRowProps {
  field: LeadFieldKey;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  existingValue?: string | null;
  isChanged?: boolean;
  isMatchKey?: boolean;
  readOnly?: boolean;
}

function FieldRow({
  field,
  value,
  onChange,
  error,
  existingValue,
  isChanged,
  isMatchKey,
  readOnly = false,
}: FieldRowProps) {
  const label = FIELD_LABELS[field] || field;
  const showComparison = existingValue !== undefined;

  return (
    <tr className={`${isChanged ? 'bg-warning/5' : ''} ${error ? 'bg-error/5' : ''}`}>
      <td className="px-3 py-2 text-xs font-medium text-darklink whitespace-nowrap">
        {label}
        {isMatchKey && (
          <span className="ml-1 text-[10px] text-primary">(clé)</span>
        )}
      </td>

      {showComparison && (
        <td className="px-3 py-2 text-xs text-darklink">
          {existingValue || <span className="text-darklink/50">—</span>}
        </td>
      )}

      <td className="px-3 py-2">
        {readOnly ? (
          <span className={`text-xs ${isChanged ? 'font-medium text-ld' : 'text-darklink'}`}>
            {value || <span className="text-darklink/50">—</span>}
          </span>
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`
              w-full px-2 py-1 text-xs rounded border
              ${error
                ? 'border-error bg-error/5 text-error'
                : isChanged
                  ? 'border-warning bg-warning/5'
                  : 'border-border dark:border-darkborder bg-white dark:bg-dark'
              }
              focus:outline-none focus:ring-1 focus:ring-primary
            `}
          />
        )}
        {error && (
          <p className="mt-0.5 text-[10px] text-error">{error}</p>
        )}
      </td>
    </tr>
  );
}

// =============================================================================
// ISSUE HEADER COMPONENTS
// =============================================================================

function FileDuplicateHeader({ row }: { row: FileDuplicateRowV2 }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-warning/5 border border-warning/20 rounded-lg mb-4">
      <IconCopy size={20} className="text-warning mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-warning">
          Doublon détecté dans le fichier
        </p>
        <p className="mt-1 text-xs text-darklink">
          Cette ligne a le même <span className="font-medium">{FIELD_LABELS[row.matchedField]}</span> que
          la ligne {row.firstOccurrenceRow}
        </p>
        <p className="mt-0.5 text-xs text-darklink/70">
          Valeur: <span className="font-mono">{row.matchedValue}</span>
        </p>
        <p className="mt-2 text-xs text-darklink">
          Modifiez la valeur pour différencier ce lead, ou ignorez-le.
        </p>
      </div>
    </div>
  );
}

function DbDuplicateHeader({ row }: { row: DbDuplicateRowV2 }) {
  const diffCount = row.changedFields.length;

  return (
    <div className="flex items-start gap-3 p-3 bg-info/5 border border-info/20 rounded-lg mb-4">
      <IconDatabase size={20} className="text-info mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-info">
          Lead existant trouvé
        </p>
        <p className="mt-1 text-xs text-darklink">
          Correspondance sur <span className="font-medium">{FIELD_LABELS[row.matchedField]}</span>:{' '}
          <span className="font-mono">{row.matchedValue}</span>
        </p>
        {diffCount > 0 ? (
          <p className="mt-0.5 text-xs text-darklink/70">
            {diffCount} champ{diffCount > 1 ? 's' : ''} différent{diffCount > 1 ? 's' : ''}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-darklink/70">
            Données identiques
          </p>
        )}
        <p className="mt-1 text-xs text-darklink/70">
          Créé le {new Date(row.existingLead.createdAt).toLocaleDateString('fr-FR')}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// ACTION DROPDOWN OPTIONS
// =============================================================================

function buildOptions(issueType: PreviewIssueType) {
  const availableActions = AVAILABLE_ACTIONS_BY_TYPE[issueType];
  return availableActions.map((action) => ({
    value: action,
    label: UNIFIED_ROW_ACTION_LABELS[action],
  }));
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function UnifiedRowModal({
  isOpen,
  onClose,
  issueType,
  rowNumber,
  row,
  currentAction,
  currentEdits,
  mappings,
  onActionChange,
  onSave,
}: UnifiedRowModalProps) {
  // Compute initial values based on row data and current edits
  const initialValues = useMemo(() => {
    const values: Partial<Record<LeadFieldKey, string>> = {};

    // Get field values from row
    if (row.displayData) {
      if (row.displayData.email) values.email = row.displayData.email;
      if (row.displayData.phone) values.phone = row.displayData.phone;
      if (row.displayData.firstName) values.first_name = row.displayData.firstName;
      if (row.displayData.lastName) values.last_name = row.displayData.lastName;
      if (row.displayData.company) values.company = row.displayData.company;
    }

    // For invalid rows, get data from validation result
    if (issueType === 'invalid') {
      const invalidRow = row as InvalidRowV2;
      if (invalidRow.validationResult?.normalizedData) {
        Object.assign(values, invalidRow.validationResult.normalizedData);
      }
    }

    // For file duplicates, get data from validation result
    if (issueType === 'file_duplicate') {
      const fileDupRow = row as FileDuplicateRowV2;
      if (fileDupRow.validationResult?.normalizedData) {
        Object.assign(values, fileDupRow.validationResult.normalizedData);
      }
    }

    // Overlay current edits (take precedence)
    Object.assign(values, currentEdits);

    return values;
  }, [row, currentEdits, issueType]);

  // Local edit state - initialized with computed values
  const [editValues, setEditValues] = useState<Partial<Record<LeadFieldKey, string>>>(initialValues);

  // Reset edit values when row changes (modal opens for different row)
  useEffect(() => {
    setEditValues(initialValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only reset when rowNumber changes, not initialValues
  }, [rowNumber]);

  // Get mapped fields to display
  const mappedFields = useMemo(() => {
    return mappings
      .filter((m) => m.targetField)
      .map((m) => m.targetField as LeadFieldKey);
  }, [mappings]);

  // Get dynamic error map: show original errors, but hide them when user fixes the field
  const errorMap = useMemo(() => {
    if (issueType !== 'invalid') return new Map<LeadFieldKey, string>();

    const invalid = row as InvalidRowV2;
    const originalErrors = new Map(invalid.errors.map((e) => [e.field, e.message]));

    // Re-validate current values to see which errors are still present
    const currentErrors = validateCurrentValues(editValues);

    // For each original error, check if it's still an error after user edits
    const resultErrors = new Map<LeadFieldKey, string>();
    for (const [field, message] of originalErrors) {
      // Check if user has edited this field
      const originalValue = initialValues[field] || '';
      const currentValue = editValues[field] || '';
      const wasEdited = originalValue !== currentValue;

      if (wasEdited) {
        // User edited this field - only show error if validation still fails
        const stillHasError = currentErrors.get(field);
        if (stillHasError) {
          resultErrors.set(field, stillHasError);
        }
        // If no error after edit, the field is fixed - don't add to resultErrors
      } else {
        // User hasn't edited this field - show original error
        resultErrors.set(field, message);
      }
    }

    // Also add any new errors from validation (e.g., user broke a previously valid field)
    for (const [field, message] of currentErrors) {
      if (!resultErrors.has(field)) {
        const originalValue = initialValues[field] || '';
        const currentValue = editValues[field] || '';
        const wasEdited = originalValue !== currentValue;
        if (wasEdited) {
          resultErrors.set(field, message);
        }
      }
    }

    return resultErrors;
  }, [issueType, editValues, initialValues, row]);

  // Get changed fields and existing data for DB duplicates
  const { changedFields, existingLead, matchedField } = useMemo(() => {
    if (issueType === 'db_duplicate') {
      const dbRow = row as DbDuplicateRowV2;
      return {
        changedFields: new Set(dbRow.changedFields),
        existingLead: dbRow.existingLead,
        matchedField: dbRow.matchedField,
      };
    }
    return {
      changedFields: new Set<LeadFieldKey>(),
      existingLead: null as ExistingLeadDataV2 | null,
      matchedField: null as DuplicateCheckField | null,
    };
  }, [row, issueType]);

  // Handle field change
  const handleFieldChange = useCallback((field: LeadFieldKey, value: string) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    onSave(editValues);
    onClose();
  }, [editValues, onSave, onClose]);

  // Get existing value for comparison
  const getExistingValue = (field: LeadFieldKey): string | null => {
    if (!existingLead) return null;
    const fieldMap: Record<string, keyof ExistingLeadDataV2> = {
      email: 'email',
      phone: 'phone',
      first_name: 'firstName',
      last_name: 'lastName',
      company: 'company',
      job_title: 'jobTitle',
      external_id: 'externalId',
      status: 'status',
    };
    const key = fieldMap[field];
    if (!key) return null;
    return existingLead[key] as string | null;
  };

  // Title based on issue type
  const title = `Ligne ${rowNumber} - ${PREVIEW_ISSUE_LABELS[issueType]}`;

  // Show comparison column for DB duplicates
  const showComparison = issueType === 'db_duplicate';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
    >
      <div className="space-y-4">
        {/* Issue-specific header (only for duplicates, not invalid - errors shown inline on fields) */}
        {issueType === 'file_duplicate' && <FileDuplicateHeader row={row as FileDuplicateRowV2} />}
        {issueType === 'db_duplicate' && <DbDuplicateHeader row={row as DbDuplicateRowV2} />}

        {/* Fields table */}
        <div className="border border-border dark:border-darkborder rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-lightgray dark:bg-darkgray">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-darklink w-32">
                  Champ
                </th>
                {showComparison && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-darklink w-1/3">
                    Base de données
                  </th>
                )}
                <th className="px-3 py-2 text-left text-xs font-medium text-darklink">
                  {showComparison ? 'Fichier (éditable)' : 'Valeur'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-darkborder">
              {mappedFields.map((field) => (
                <FieldRow
                  key={field}
                  field={field}
                  value={editValues[field] || ''}
                  onChange={(v) => handleFieldChange(field, v)}
                  error={errorMap.get(field)}
                  existingValue={showComparison ? getExistingValue(field) ?? undefined : undefined}
                  isChanged={changedFields.has(field)}
                  isMatchKey={field === matchedField}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Action selector */}
        <div className="flex items-center gap-3 pt-2 border-t border-border dark:border-darkborder">
          <span className="text-sm text-darklink">Action:</span>
          <InlineDropdown
            options={buildOptions(issueType)}
            value={currentAction}
            onChange={(v) => onActionChange(v as UnifiedRowAction)}
            widthClass="w-36"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-1">
            <IconCheck size={16} />
            Enregistrer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
