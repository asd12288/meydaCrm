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
import { UserAvatar } from '@/modules/shared';
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ASSIGNMENT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = assignment.mode === option.value;
            return (
              <button
                key={option.value}
                type="button"
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
                className={`
                  p-4 rounded-xl border text-left transition-all
                  ${isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/30 bg-white dark:bg-dark'
                  }
                `}
              >
                <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-primary' : 'text-darklink'}`} />
                <div className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-ld'}`}>
                  {option.label}
                </div>
                <div className="text-xs text-darklink mt-0.5">{option.description}</div>
              </button>
            );
          })}
        </div>

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
        <div className="grid grid-cols-3 gap-3">
          {DUPLICATE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = duplicateConfig.strategy === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onUpdateDuplicates({ strategy: option.value as DuplicateConfig['strategy'] })
                }
                className={`
                  p-4 rounded-xl border text-left transition-all
                  ${isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/30 bg-white dark:bg-dark'
                  }
                `}
              >
                <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-primary' : 'text-darklink'}`} />
                <div className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-ld'}`}>
                  {option.label}
                </div>
                <div className="text-xs text-darklink mt-0.5">{option.description}</div>
              </button>
            );
          })}
        </div>

        {/* Advanced options */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 mt-4 text-sm text-darklink hover:text-ld transition-colors"
        >
          <IconChevronDown
            size={16}
            className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          />
          Options avancees
        </button>

        {showAdvanced && (
          <div className="mt-4 p-4 bg-muted/50 dark:bg-darkmuted rounded-xl space-y-4">
            {/* Check fields */}
            <div>
              <label className="text-sm text-ld mb-2 block">Champs de detection</label>
              <div className="flex flex-wrap gap-2">
                {DUPLICATE_CHECK_FIELDS.map((field) => {
                  const isChecked = duplicateConfig.checkFields.includes(field);
                  const fieldLabels: Record<LeadFieldKey, string> = {
                    email: 'Email',
                    phone: 'Telephone',
                    external_id: 'ID externe',
                    first_name: 'Prenom',
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
                    assigned_to: 'Assigne a',
                  };
                  return (
                    <button
                      key={field}
                      type="button"
                      onClick={() => {
                        const newFields = isChecked
                          ? duplicateConfig.checkFields.filter((f) => f !== field)
                          : [...duplicateConfig.checkFields, field];
                        onUpdateDuplicates({ checkFields: newFields as LeadFieldKey[] });
                      }}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors
                        ${isChecked
                          ? 'bg-primary/10 text-primary'
                          : 'bg-white dark:bg-dark text-darklink hover:text-ld'
                        }
                      `}
                    >
                      {isChecked && <IconCheck size={14} />}
                      {fieldLabels[field]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-dark cursor-pointer">
                <span className="text-sm text-ld">Verifier dans la base de donnees</span>
                <input
                  type="checkbox"
                  checked={duplicateConfig.checkDatabase}
                  onChange={(e) => onUpdateDuplicates({ checkDatabase: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-dark cursor-pointer">
                <span className="text-sm text-ld">Detecter les doublons dans le fichier</span>
                <input
                  type="checkbox"
                  checked={duplicateConfig.checkWithinFile}
                  onChange={(e) => onUpdateDuplicates({ checkWithinFile: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
              </label>
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
