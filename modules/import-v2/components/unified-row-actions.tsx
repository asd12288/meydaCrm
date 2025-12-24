/**
 * Unified Row Actions Component
 *
 * Consistent inline action controls for all preview issue types:
 * - Invalid rows
 * - File duplicates
 * - Database duplicates
 */

'use client';

import { IconX, IconPlus, IconReplace, IconPencil, IconCheck } from '@tabler/icons-react';
import { InlineDropdown } from '@/modules/shared';
import type { UnifiedRowAction, PreviewIssueType } from '../config/constants';
import { AVAILABLE_ACTIONS_BY_TYPE, UNIFIED_ROW_ACTION_LABELS } from '../config/constants';

// =============================================================================
// TYPES
// =============================================================================

interface UnifiedRowActionsProps {
  /** Row number for identification */
  rowNumber: number;
  /** Type of issue (determines available actions) */
  issueType: PreviewIssueType;
  /** Currently selected action */
  currentAction: UnifiedRowAction;
  /** Whether this row has been edited */
  hasEdits?: boolean;
  /** Callback when action changes */
  onActionChange: (action: UnifiedRowAction) => void;
  /** Callback to open view/edit modal */
  onViewEdit: () => void;
}

// =============================================================================
// ICONS BY ACTION
// =============================================================================

const ACTION_ICONS: Record<UnifiedRowAction, typeof IconX> = {
  skip: IconX,
  import: IconPlus,
  update: IconReplace,
};

// =============================================================================
// DROPDOWN OPTIONS BUILDER
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

export function UnifiedRowActions({
  issueType,
  currentAction,
  hasEdits = false,
  onActionChange,
  onViewEdit,
}: UnifiedRowActionsProps) {
  const options = buildOptions(issueType);

  return (
    <div className="flex items-center gap-2">
      {/* Action dropdown */}
      <InlineDropdown
        options={options}
        value={currentAction}
        onChange={(v) => onActionChange(v as UnifiedRowAction)}
        widthClass="w-28"
      />

      {/* View/Edit button */}
      <button
        type="button"
        onClick={onViewEdit}
        className={`
          inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded
          text-primary bg-lightprimary/50 dark:bg-primary/10
          hover:bg-lightprimary dark:hover:bg-primary/20 transition-colors
          ${hasEdits ? 'ring-1 ring-primary' : ''}
        `}
        title={hasEdits ? 'Modifié - cliquez pour voir' : 'Voir / Éditer'}
      >
        {hasEdits ? (
          <>
            <IconCheck size={12} className="text-success" />
            Modifié
          </>
        ) : (
          <>
            <IconPencil size={12} />
            Voir
          </>
        )}
      </button>
    </div>
  );
}

// =============================================================================
// COMPACT VARIANT (for smaller tables)
// =============================================================================

interface UnifiedRowActionsCompactProps extends UnifiedRowActionsProps {
  /** Show only icons, no text */
  iconsOnly?: boolean;
}

export function UnifiedRowActionsCompact({
  issueType,
  currentAction,
  hasEdits = false,
  onActionChange,
  onViewEdit,
  iconsOnly = false,
}: UnifiedRowActionsCompactProps) {
  const availableActions = AVAILABLE_ACTIONS_BY_TYPE[issueType];

  const btnBase = `
    inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded
    transition-colors border
  `;

  const getButtonStyle = (action: UnifiedRowAction) => {
    const isActive = currentAction === action;
    if (isActive) {
      switch (action) {
        case 'skip':
          return 'bg-darklink/10 text-darklink border-darklink/20';
        case 'import':
          return 'bg-primary/10 text-primary border-primary/20';
        case 'update':
          return 'bg-success/10 text-success border-success/20';
      }
    }
    return 'text-darklink hover:bg-lightgray dark:hover:bg-darkgray border-transparent';
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* Action buttons */}
      {availableActions.map((action) => {
        const Icon = ACTION_ICONS[action];
        return (
          <button
            key={action}
            type="button"
            onClick={() => onActionChange(action)}
            className={`${btnBase} ${getButtonStyle(action)}`}
            title={UNIFIED_ROW_ACTION_LABELS[action]}
          >
            <Icon size={12} />
            {!iconsOnly && UNIFIED_ROW_ACTION_LABELS[action]}
          </button>
        );
      })}

      {/* View/Edit button */}
      <button
        type="button"
        onClick={onViewEdit}
        className={`${btnBase} ${
          hasEdits
            ? 'bg-success/10 text-success border-success/20'
            : 'text-primary hover:bg-lightprimary/50 dark:hover:bg-primary/10 border-transparent'
        }`}
        title={hasEdits ? 'Modifié - cliquez pour voir' : 'Voir / Éditer'}
      >
        {hasEdits ? <IconCheck size={12} /> : <IconPencil size={12} />}
        {!iconsOnly && (hasEdits ? 'Modifié' : 'Voir')}
      </button>
    </div>
  );
}
