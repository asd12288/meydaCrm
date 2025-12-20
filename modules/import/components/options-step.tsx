'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import {
  UserAvatar,
  OptionCard,
  OptionCardGroup,
  ToggleChip,
  ToggleChipGroup,
  CheckboxCard,
} from '@/modules/shared';
import type { AssignmentConfig, DuplicateConfig, LeadFieldKey } from '../types';
import { DUPLICATE_CHECK_FIELDS } from '../types/mapping';
import type { SalesUser } from '@/modules/leads/types';

interface OptionsStepProps {
  assignment: AssignmentConfig;
  duplicateConfig: DuplicateConfig;
  salesUsers: SalesUser[];
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
  onUpdateAssignment,
  onUpdateDuplicates,
}: OptionsStepProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeSalesUsers = salesUsers.filter(
    (u) => u.role === 'sales' || u.role === 'admin'
  );

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

        {/* Advanced options */}
        <Button
          type="button"
          variant="ghostText"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mt-4"
        >
          <IconChevronDown
            size={16}
            className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          />
          Options avancées
        </Button>

        {showAdvanced && (
          <div className="mt-4 p-4 bg-muted/50 dark:bg-darkmuted rounded-xl space-y-4">
            {/* Check fields */}
            <div>
              <label className="text-sm text-ld mb-2 block">Champs de détection</label>
              <ToggleChipGroup>
                {DUPLICATE_CHECK_FIELDS.map((field) => {
                  const isChecked = duplicateConfig.checkFields.includes(field);
                  const fieldLabels: Record<LeadFieldKey, string> = {
                    email: 'Email',
                    phone: 'Téléphone',
                    external_id: 'ID externe',
                    first_name: 'Prénom',
                    last_name: 'Nom',
                    company: 'Entreprise',
                    job_title: 'Poste',
                    address: 'Adresse',
                    city: 'Ville',
                    postal_code: 'Code postal',
                    country: 'Pays',
                    status: 'Statut',
                    source: 'Source',
                    notes: 'Notes',
                    assigned_to: 'Assigné à',
                  };
                  return (
                    <ToggleChip
                      key={field}
                      label={fieldLabels[field]}
                      isSelected={isChecked}
                      onClick={() => {
                        const newFields = isChecked
                          ? duplicateConfig.checkFields.filter((f) => f !== field)
                          : [...duplicateConfig.checkFields, field];
                        onUpdateDuplicates({ checkFields: newFields as LeadFieldKey[] });
                      }}
                    />
                  );
                })}
              </ToggleChipGroup>
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              <CheckboxCard
                label="Vérifier dans la base de données"
                checked={duplicateConfig.checkDatabase}
                onChange={(e) => onUpdateDuplicates({ checkDatabase: e.target.checked })}
              />
              <CheckboxCard
                label="Détecter les doublons dans le fichier"
                checked={duplicateConfig.checkWithinFile}
                onChange={(e) => onUpdateDuplicates({ checkWithinFile: e.target.checked })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl text-sm text-ld">
        <span className="font-medium">Resume : </span>
        {assignment.mode === 'none' && 'Leads sans attribution'}
        {assignment.mode === 'round_robin' && `Repartis entre ${assignment.roundRobinUserIds?.length || 0} commerciaux`}
        {assignment.mode === 'by_column' && 'Attribution par colonne'}
        {' • '}
        {duplicateConfig.strategy === 'skip' && 'Doublons ignores'}
        {duplicateConfig.strategy === 'update' && 'Doublons mis a jour'}
        {duplicateConfig.strategy === 'create' && 'Doublons crees'}
      </div>
    </div>
  );
}
