'use client';

import { useState } from 'react';
import {
  IconCheck,
  IconAlertTriangle,
  IconChevronDown,
  IconChevronUp,
  IconX,
  IconLoader2,
  IconUser,
  IconCopy,
} from '@tabler/icons-react';
import { ErrorReportModal } from './error-report-modal';
import type {
  ValidatedRow,
  AssignmentConfig,
  DuplicateConfig,
  ImportProgress,
  UploadedFile,
} from '../types';
import { DUPLICATE_STRATEGIES } from '../config/constants';
import { ImportProgressBar } from '../ui/import-progress';
import type { SalesUser } from '@/modules/leads/types';

interface ReviewStepProps {
  file: UploadedFile | null;
  validatedRows: ValidatedRow[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
  };
  assignment: AssignmentConfig;
  duplicateConfig: DuplicateConfig;
  onUpdateAssignment: (config: Partial<AssignmentConfig>) => void;
  onUpdateDuplicates: (config: Partial<DuplicateConfig>) => void;
  salesUsers: SalesUser[];
  progress: ImportProgress | null;
  importJobId?: string | null;
}

export function ReviewStep({
  file,
  validatedRows,
  summary,
  assignment,
  duplicateConfig,
  onUpdateAssignment,
  onUpdateDuplicates,
  salesUsers,
  progress,
  importJobId,
}: ReviewStepProps) {
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showInvalidRows, setShowInvalidRows] = useState(false);

  const activeSalesUsers = salesUsers.filter(
    (u) => u.role === 'sales' || u.role === 'admin'
  );
  const hasIssues = summary.invalid > 0 || summary.duplicates > 0;
  const invalidRows = validatedRows.filter((r) => !r.isValid || r.duplicateOf);

  // Show progress state during import
  if (progress) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        {progress.phase === 'completed' ? (
          <>
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
              <IconCheck className="w-10 h-10 text-success" strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-semibold text-ld mb-2">
              Import termine !
            </h3>
            <p className="text-darklink">
              <span className="font-semibold text-success">
                {progress.importedRows.toLocaleString('fr-FR')}
              </span>{' '}
              leads importes avec succes
            </p>
          </>
        ) : progress.phase === 'failed' ? (
          <>
            <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mb-6">
              <IconX className="w-10 h-10 text-error" strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-semibold text-error mb-2">
              L'import a echoue
            </h3>
            {progress.errorMessage && (
              <p className="text-darklink max-w-md text-center">{progress.errorMessage}</p>
            )}
          </>
        ) : (
          <>
            <IconLoader2 className="w-16 h-16 text-primary animate-spin mb-6" />
            <h3 className="text-xl font-medium text-ld mb-6">
              Import en cours...
            </h3>
            <ImportProgressBar progress={progress} showDetails={true} />
            <p className="text-darklink mt-4">
              <span className="font-medium text-ld">
                {progress.processedRows.toLocaleString('fr-FR')}
              </span>{' '}
              / {progress.totalRows.toLocaleString('fr-FR')} leads traites
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Hero summary card */}
      <div className="bg-gradient-to-br from-success/5 to-success/10 border border-success/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-darklink mb-1">Prets a importer</p>
            <p className="text-3xl font-bold text-success">
              {summary.valid.toLocaleString('fr-FR')} leads
            </p>
          </div>
          <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
            <IconCheck className="w-7 h-7 text-success" />
          </div>
        </div>
        {hasIssues && (
          <div className="mt-4 pt-4 border-t border-success/20 flex gap-4 text-sm">
            {summary.invalid > 0 && (
              <button
                onClick={() => setShowErrorModal(true)}
                className="text-error hover:underline flex items-center gap-1"
              >
                <IconAlertTriangle className="w-4 h-4" />
                {summary.invalid} invalide{summary.invalid > 1 ? 's' : ''}
              </button>
            )}
            {summary.duplicates > 0 && (
              <span className="text-warning">
                {summary.duplicates} doublon{summary.duplicates > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
        
        {/* Error Report Modal */}
        {importJobId && summary.invalid > 0 && (
          <ErrorReportModal
            importJobId={importJobId}
            isOpen={showErrorModal}
            onClose={() => setShowErrorModal(false)}
            invalidRowsCount={summary.invalid}
          />
        )}
      </div>

      {/* Options grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Assignment */}
        <div className="bg-white dark:bg-dark border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <IconUser className="w-4 h-4 text-primary" />
            <label className="text-sm font-medium text-ld">Attribution</label>
          </div>
          <select
            value={getAssignmentValue(assignment)}
            onChange={(e) => handleAssignmentChange(e.target.value, onUpdateAssignment)}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted dark:bg-darkmuted text-ld focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          >
            <option value="none">Sans attribution</option>
            <optgroup label="Commercial">
              {activeSalesUsers.map((user) => (
                <option key={user.id} value={`single:${user.id}`}>
                  {user.display_name || user.id}
                </option>
              ))}
            </optgroup>
            <option value="round_robin">Repartir entre plusieurs...</option>
          </select>

          {/* Round-robin selection */}
          {assignment.mode === 'round_robin' && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-darklink mb-2">
                Minimum 2 commerciaux
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {activeSalesUsers.map((user) => {
                  const isChecked = assignment.roundRobinUserIds?.includes(user.id) || false;
                  return (
                    <label
                      key={user.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-sm ${
                        isChecked ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-ld'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const currentIds = assignment.roundRobinUserIds || [];
                          const newIds = e.target.checked
                            ? [...currentIds, user.id]
                            : currentIds.filter((id) => id !== user.id);
                          onUpdateAssignment({ roundRobinUserIds: newIds });
                        }}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="truncate">{user.display_name || user.id}</span>
                    </label>
                  );
                })}
              </div>
              {(assignment.roundRobinUserIds?.length || 0) < 2 && (
                <p className="text-xs text-warning mt-2">
                  Selectionnez au moins 2 commerciaux
                </p>
              )}
            </div>
          )}
        </div>

        {/* Duplicates */}
        <div className="bg-white dark:bg-dark border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <IconCopy className="w-4 h-4 text-primary" />
            <label className="text-sm font-medium text-ld">Doublons</label>
          </div>
          <select
            value={duplicateConfig.strategy}
            onChange={(e) =>
              onUpdateDuplicates({
                strategy: e.target.value as DuplicateConfig['strategy'],
              })
            }
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted dark:bg-darkmuted text-ld focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          >
            {DUPLICATE_STRATEGIES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invalid rows (expandable) */}
      {hasIssues && (
        <div className="bg-white dark:bg-dark border border-border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowInvalidRows(!showInvalidRows)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                <IconAlertTriangle className="w-4 h-4 text-warning" />
              </div>
              <span className="text-sm font-medium text-ld">
                {summary.invalid + summary.duplicates} ligne{summary.invalid + summary.duplicates > 1 ? 's' : ''} avec probleme{summary.invalid + summary.duplicates > 1 ? 's' : ''}
              </span>
            </div>
            <div className={`transition-transform ${showInvalidRows ? 'rotate-180' : ''}`}>
              <IconChevronDown className="w-5 h-5 text-darklink" />
            </div>
          </button>

          {showInvalidRows && (
            <div className="border-t border-border">
              <div className="max-h-52 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted dark:bg-darkmuted sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-darklink w-16">
                        Ligne
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-darklink">
                        Nom
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-darklink">
                        Probleme
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invalidRows.slice(0, 20).map((row) => (
                      <tr key={row.rowNumber} className="hover:bg-muted/50">
                        <td className="px-4 py-2 text-darklink">{row.rowNumber}</td>
                        <td className="px-4 py-2 text-ld">
                          {[row.data.first_name, row.data.last_name]
                            .filter(Boolean)
                            .join(' ') || '-'}
                        </td>
                        <td className="px-4 py-2">
                          {Object.keys(row.errors).length > 0 && (
                            <span className="inline-block px-2 py-0.5 bg-error/10 text-error text-xs rounded">
                              {Object.values(row.errors)[0]}
                            </span>
                          )}
                          {row.duplicateOf && (
                            <span className="inline-block px-2 py-0.5 bg-warning/10 text-warning text-xs rounded">
                              Doublon
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {invalidRows.length > 20 && (
                <p className="text-xs text-darklink text-center py-3 border-t border-border bg-muted/30">
                  +{invalidRows.length - 20} autres lignes
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper functions
function getAssignmentValue(assignment: AssignmentConfig): string {
  switch (assignment.mode) {
    case 'single':
      return `single:${assignment.singleUserId || ''}`;
    case 'round_robin':
      return 'round_robin';
    default:
      return 'none';
  }
}

function handleAssignmentChange(
  value: string,
  onUpdate: (config: Partial<AssignmentConfig>) => void
) {
  if (value === 'none') {
    onUpdate({ mode: 'none', singleUserId: undefined, roundRobinUserIds: undefined });
  } else if (value === 'round_robin') {
    onUpdate({ mode: 'round_robin', singleUserId: undefined });
  } else if (value.startsWith('single:')) {
    const userId = value.replace('single:', '');
    onUpdate({ mode: 'single', singleUserId: userId, roundRobinUserIds: undefined });
  }
}
