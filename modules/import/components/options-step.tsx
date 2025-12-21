'use client';

import {
  IconUserOff,
  IconUsers,
  IconFileSpreadsheet,
  IconCopy,
  IconRefresh,
  IconPlus,
  IconCheck,
  IconChevronDown,
} from '@tabler/icons-react';
import {
  UserAvatar,
  OptionCard,
  OptionCardGroup,
} from '@/modules/shared';
import type { AssignmentConfig, DuplicateConfig } from '../types';
import type { SalesUser } from '@/modules/leads/types';

interface OptionsStepProps {
  assignment: AssignmentConfig;
  duplicateConfig: DuplicateConfig;
  salesUsers: SalesUser[];
  /** Available columns from the file for by_column assignment */
  availableColumns?: string[];
  onUpdateAssignment: (config: Partial<AssignmentConfig>) => void;
  onUpdateDuplicates: (config: Partial<DuplicateConfig>) => void;
}

const ASSIGNMENT_OPTIONS = [
  {
    value: 'none',
    label: 'Ne pas assigner',
    description: 'Leads sans commercial',
    icon: IconUserOff,
  },
  {
    value: 'round_robin',
    label: 'Repartir',
    description: 'Distribution equitable',
    icon: IconUsers,
  },
  {
    value: 'by_column',
    label: 'Par colonne',
    description: 'Depuis le fichier',
    icon: IconFileSpreadsheet,
  },
] as const;

const DUPLICATE_OPTIONS = [
  {
    value: 'skip',
    label: 'Ignorer',
    description: 'Ne pas importer les doublons',
    icon: IconCopy,
  },
  {
    value: 'update',
    label: 'Mettre a jour',
    description: 'Actualiser les existants',
    icon: IconRefresh,
  },
  {
    value: 'create',
    label: 'Creer',
    description: 'Nouveaux leads',
    icon: IconPlus,
  },
] as const;

export function OptionsStep({
  assignment,
  duplicateConfig,
  salesUsers,
  availableColumns = [],
  onUpdateAssignment,
  onUpdateDuplicates,
}: OptionsStepProps) {
  const activeSalesUsers = salesUsers.filter(
    (u) => u.role === 'sales' || u.role === 'admin'
  );

  // Sort columns by relevance - columns with "commercial", "assign", "user", "rep" are likely assignment columns
  const sortedColumns = [...availableColumns].sort((a, b) => {
    const relevantTerms = ['commercial', 'assign', 'user', 'rep', 'sales', 'agent', 'conseiller', 'responsable'];
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    const aRelevant = relevantTerms.some(term => aLower.includes(term));
    const bRelevant = relevantTerms.some(term => bLower.includes(term));
    if (aRelevant && !bRelevant) return -1;
    if (!aRelevant && bRelevant) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-ld">Options d&apos;import</h3>
        <p className="text-sm text-darklink mt-1">
          Configurez l&apos;attribution et la gestion des doublons
        </p>
      </div>

      {/* Assignment Section */}
      <div>
        <h4 className="text-sm font-medium text-ld mb-3">Attribution des leads</h4>
        <OptionCardGroup columns={4}>
          {ASSIGNMENT_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <OptionCard
                key={option.value}
                label={option.label}
                description={option.description}
                icon={<Icon className="w-5 h-5" />}
                isSelected={assignment.mode === option.value}
                onClick={() =>
                  onUpdateAssignment({
                    mode: option.value as AssignmentConfig['mode'],
                    singleUserId: undefined,
                    // Auto-select all sales users when choosing round_robin
                    roundRobinUserIds: option.value === 'round_robin'
                      ? activeSalesUsers.map(u => u.id)
                      : undefined,
                  })
                }
              />
            );
          })}
        </OptionCardGroup>

        {/* Round-robin user selection with avatars */}
        {assignment.mode === 'round_robin' && (
          <div className="mt-4 p-4 bg-muted/50 dark:bg-darkmuted rounded-xl">
            <p className="text-sm text-darklink mb-3">
              Commerciaux selectionnes
              {assignment.roundRobinUserIds && assignment.roundRobinUserIds.length > 0 && (
                <span className="ml-2 text-primary font-medium">
                  ({assignment.roundRobinUserIds.length} selectionnes)
                </span>
              )}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {activeSalesUsers.map((user) => {
                const isChecked = assignment.roundRobinUserIds?.includes(user.id) || false;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      const currentIds = assignment.roundRobinUserIds || [];
                      const newIds = isChecked
                        ? currentIds.filter((id) => id !== user.id)
                        : [...currentIds, user.id];
                      onUpdateAssignment({ roundRobinUserIds: newIds });
                    }}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                      ${isChecked
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:border-border hover:bg-white dark:hover:bg-dark'
                      }
                    `}
                  >
                    <UserAvatar
                      name={user.display_name}
                      avatar={user.avatar}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${isChecked ? 'text-primary' : 'text-ld'}`}>
                        {user.display_name || 'Sans nom'}
                      </div>
                      <div className="text-xs text-darklink capitalize">{user.role}</div>
                    </div>
                    {isChecked && (
                      <IconCheck className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* By column assignment - column selector */}
        {assignment.mode === 'by_column' && (
          <div className="mt-4 p-4 bg-muted/50 dark:bg-darkmuted rounded-xl space-y-4">
            <div>
              <label className="text-sm text-ld mb-2 block">
                Colonne d&apos;attribution
              </label>
              {sortedColumns.length > 0 ? (
                <div className="relative">
                  <select
                    value={assignment.assignmentColumn || ''}
                    onChange={(e) => onUpdateAssignment({ assignmentColumn: e.target.value || undefined })}
                    className="form-control-input w-full pr-10"
                  >
                    <option value="">Sélectionner une colonne...</option>
                    {sortedColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                  <IconChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-darklink pointer-events-none" />
                </div>
              ) : (
                <p className="text-sm text-warning">
                  Aucune colonne disponible. Vérifiez le mapping des colonnes.
                </p>
              )}
            </div>

            {/* Help text */}
            <div className="text-xs text-darklink space-y-1">
              <p>
                <strong>Comment ça marche :</strong> Les valeurs de cette colonne seront comparées aux noms des commerciaux.
              </p>
              <p>
                Exemple : si une cellule contient &quot;Jean Dupont&quot;, le lead sera attribué au commercial &quot;Jean Dupont&quot;.
              </p>
              <p className="text-warning">
                Les valeurs non reconnues laisseront le lead sans attribution.
              </p>
            </div>

            {/* Show available sales users as reference */}
            {assignment.assignmentColumn && (
              <div>
                <p className="text-sm text-darklink mb-2">
                  Commerciaux disponibles ({activeSalesUsers.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeSalesUsers.map((user) => (
                    <span
                      key={user.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-dark rounded text-xs text-ld border border-border"
                    >
                      <UserAvatar name={user.display_name} avatar={user.avatar} size="xs" />
                      {user.display_name || 'Sans nom'}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Duplicates Section */}
      <div>
        <h4 className="text-sm font-medium text-ld mb-3">Gestion des doublons</h4>
        <OptionCardGroup columns={3}>
          {DUPLICATE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <OptionCard
                key={option.value}
                label={option.label}
                description={option.description}
                icon={<Icon className="w-5 h-5" />}
                isSelected={duplicateConfig.strategy === option.value}
                onClick={() =>
                  onUpdateDuplicates({ strategy: option.value as DuplicateConfig['strategy'] })
                }
              />
            );
          })}
        </OptionCardGroup>
      </div>

      {/* Summary */}
      <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-darklink">Attribution :</span>
            <p className="font-medium text-ld mt-0.5">
              {assignment.mode === 'none' && 'Sans attribution'}
              {assignment.mode === 'round_robin' && (
                assignment.roundRobinUserIds && assignment.roundRobinUserIds.length > 0
                  ? `${assignment.roundRobinUserIds.length} commerciaux sélectionnés`
                  : <span className="text-warning">Aucun commercial sélectionné</span>
              )}
              {assignment.mode === 'by_column' && (
                assignment.assignmentColumn
                  ? `Colonne "${assignment.assignmentColumn}"`
                  : <span className="text-warning">Aucune colonne sélectionnée</span>
              )}
            </p>
          </div>
          <div>
            <span className="text-darklink">Doublons :</span>
            <p className="font-medium text-ld mt-0.5">
              {duplicateConfig.strategy === 'skip' && 'Ignorés (non importés)'}
              {duplicateConfig.strategy === 'update' && 'Mis à jour'}
              {duplicateConfig.strategy === 'create' && 'Créés comme nouveaux'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
