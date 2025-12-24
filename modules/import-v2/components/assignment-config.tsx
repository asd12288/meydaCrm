/**
 * Assignment Configuration Component
 *
 * Collapsible UI for configuring automatic lead assignment during import.
 * Supports round-robin distribution among selected sales users.
 * Features avatar grid layout with select all/unselect all functionality.
 */

'use client';

import { IconChevronDown, IconChevronRight, IconUsers, IconInfoCircle } from '@tabler/icons-react';
import { CardBox, UserAvatar } from '@/modules/shared';
import type { SalesUser } from '@/modules/leads/types';

// =============================================================================
// TYPES
// =============================================================================

interface AssignmentConfigProps {
  /** Whether assignment is enabled */
  enabled: boolean;
  /** Selected user IDs for round-robin */
  selectedUserIds: string[];
  /** Available sales users */
  salesUsers: SalesUser[];
  /** Number of leads that will be assigned */
  leadsToAssign: number;
  /** Toggle assignment on/off */
  onToggle: (enabled: boolean) => void;
  /** Update selected users */
  onUsersChange: (userIds: string[]) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AssignmentConfig({
  enabled,
  selectedUserIds,
  salesUsers,
  leadsToAssign,
  onToggle,
  onUsersChange,
}: AssignmentConfigProps) {
  // Handle checkbox change for a user
  const handleUserToggle = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onUsersChange(selectedUserIds.filter((id) => id !== userId));
    } else {
      onUsersChange([...selectedUserIds, userId]);
    }
  };

  // Select all / unselect all
  const handleSelectAll = () => {
    onUsersChange(salesUsers.map((u) => u.id));
  };

  const handleUnselectAll = () => {
    onUsersChange([]);
  };

  // Calculate distribution preview
  const selectedCount = selectedUserIds.length;
  const perPerson = selectedCount > 0 ? Math.floor(leadsToAssign / selectedCount) : 0;
  const remainder = selectedCount > 0 ? leadsToAssign % selectedCount : 0;

  // Show warning if enabled but no users selected
  const showWarning = enabled && selectedCount === 0;

  return (
    <CardBox>
      {/* Header - Click to toggle */}
      <button
        type="button"
        onClick={() => onToggle(!enabled)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          {enabled ? (
            <IconChevronDown size={18} className="text-darklink" />
          ) : (
            <IconChevronRight size={18} className="text-darklink" />
          )}
          <IconUsers size={18} className="text-darklink" />
          <span className="text-sm font-medium text-ld">Assignation automatique</span>
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded ${
            enabled
              ? 'bg-lightprimary text-primary dark:bg-primary/20'
              : 'bg-lightgray text-darklink dark:bg-darkgray'
          }`}
        >
          {enabled ? 'ON' : 'OFF'}
        </span>
      </button>

      {/* Expanded Content */}
      {enabled && (
        <div className="mt-4 pt-4 border-t border-border dark:border-darkborder">
          {/* Select All / Unselect All toggle */}
          {salesUsers.length > 0 && (
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={selectedCount === salesUsers.length ? handleUnselectAll : handleSelectAll}
                className="text-xs font-medium px-2 py-1 rounded border border-primary text-primary hover:bg-lightprimary dark:hover:bg-primary/20 transition-colors"
              >
                {selectedCount === salesUsers.length ? 'Désélectionner tout' : 'Sélectionner tout'}
              </button>
              <span className="text-xs text-darklink">
                {selectedCount} / {salesUsers.length}
              </span>
            </div>
          )}

          {/* User Grid */}
          <div className="mb-4">
            {salesUsers.length === 0 ? (
              <div className="p-3 text-sm text-darklink text-center border border-border dark:border-darkborder rounded-lg">
                Aucun utilisateur disponible
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {salesUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleUserToggle(user.id)}
                      className={`
                        flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all
                        ${
                          isSelected
                            ? 'border-primary bg-lightprimary dark:bg-primary/20'
                            : 'border-border dark:border-darkborder hover:border-darklink'
                        }
                      `}
                    >
                      <UserAvatar
                        name={user.display_name}
                        avatar={user.avatar}
                        size="sm"
                      />
                      <span className="text-xs font-medium text-ld truncate">
                        {user.display_name || 'Sans nom'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Warning */}
          {showWarning && (
            <div className="flex items-center gap-2 text-warning text-sm mb-3">
              <IconInfoCircle size={16} />
              <span>Sélectionnez au moins un commercial</span>
            </div>
          )}

          {/* Distribution Preview */}
          {selectedCount > 0 && leadsToAssign > 0 && (
            <div className="flex items-start gap-2 text-sm text-darklink bg-lightgray dark:bg-darkgray rounded-lg p-3">
              <IconInfoCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                <span className="text-ld font-medium">{leadsToAssign}</span> leads répartis entre{' '}
                <span className="text-ld font-medium">{selectedCount}</span> commerciaux
                <br />
                <span className="text-xs">
                  (~{perPerson} par personne{remainder > 0 ? `, +${remainder} restant${remainder > 1 ? 's' : ''}` : ''})
                </span>
              </div>
            </div>
          )}

          {/* No leads to assign */}
          {leadsToAssign === 0 && (
            <div className="text-sm text-darklink">
              Aucun nouveau lead à assigner (les mises à jour conservent leur assignation actuelle)
            </div>
          )}
        </div>
      )}
    </CardBox>
  );
}
