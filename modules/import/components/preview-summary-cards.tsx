'use client';

import {
  IconCheck,
  IconX,
  IconCopy,
  IconDatabase,
  IconFileSpreadsheet,
} from '@tabler/icons-react';
import type { DetailedValidationSummary } from '../types';

type TabId = 'summary' | 'invalid' | 'file_duplicates' | 'db_duplicates';

interface PreviewSummaryCardsProps {
  /** Detailed validation summary */
  summary: DetailedValidationSummary;
  /** Currently active tab */
  activeTab: TabId;
  /** Callback when a card is clicked to switch tab */
  onTabChange: (tab: TabId) => void;
  /** Selected duplicate strategy */
  duplicateStrategy: 'skip' | 'update' | 'create';
}

interface CardConfig {
  id: TabId;
  label: string;
  getValue: (s: DetailedValidationSummary) => number;
  icon: typeof IconCheck;
  baseClassName: string;
  activeClassName: string;
  iconClassName: string;
  clickable: boolean;
}

const CARDS: CardConfig[] = [
  {
    id: 'summary',
    label: 'Total',
    getValue: (s) => s.total,
    icon: IconFileSpreadsheet,
    baseClassName: 'bg-muted dark:bg-darkmuted',
    activeClassName: 'ring-2 ring-primary',
    iconClassName: 'text-darklink',
    clickable: false,
  },
  {
    id: 'summary',
    label: 'Valides',
    getValue: (s) => s.valid,
    icon: IconCheck,
    baseClassName: 'bg-lightprimary/20',
    activeClassName: 'ring-2 ring-primary',
    iconClassName: 'text-primary',
    clickable: false,
  },
  {
    id: 'invalid',
    label: 'Invalides',
    getValue: (s) => s.invalid,
    icon: IconX,
    baseClassName: 'bg-lighterror/20',
    activeClassName: 'ring-2 ring-error',
    iconClassName: 'text-error',
    clickable: true,
  },
  {
    id: 'file_duplicates',
    label: 'Doublons fichier',
    getValue: (s) => s.fileDuplicates,
    icon: IconCopy,
    baseClassName: 'bg-lightwarning/20',
    activeClassName: 'ring-2 ring-warning',
    iconClassName: 'text-warning',
    clickable: true,
  },
  {
    id: 'db_duplicates',
    label: 'Doublons base',
    getValue: (s) => s.dbDuplicates,
    icon: IconDatabase,
    baseClassName: 'bg-lightinfo/20',
    activeClassName: 'ring-2 ring-info',
    iconClassName: 'text-info',
    clickable: true,
  },
];

/**
 * Summary cards for import preview
 * Shows counts for total, valid, invalid, and duplicate rows
 * Invalid and duplicate cards are clickable to view details
 */
export function PreviewSummaryCards({
  summary,
  activeTab,
  onTabChange,
  duplicateStrategy,
}: PreviewSummaryCardsProps) {
  // Calculate effective valid count based on strategy
  const getEffectiveValidCount = () => {
    if (duplicateStrategy === 'skip') {
      return summary.valid;
    }
    // 'update' or 'create': db duplicates will be processed
    return summary.valid + summary.dbDuplicates;
  };

  return (
    <div className="grid grid-cols-5 gap-3">
      {CARDS.map((card, index) => {
        // Use effective count for "Valides" card
        const count = card.label === 'Valides'
          ? getEffectiveValidCount()
          : card.getValue(summary);
        const isActive = activeTab === card.id && card.clickable;
        const hasCount = count > 0;
        const isClickable = card.clickable && hasCount;

        return (
          <button
            key={`${card.id}-${index}`}
            type="button"
            onClick={() => isClickable && onTabChange(card.id)}
            disabled={!isClickable}
            className={`
              rounded-lg p-3 text-center transition-all
              ${card.baseClassName}
              ${isActive ? card.activeClassName : ''}
              ${isClickable ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'}
              ${!hasCount && card.clickable ? 'opacity-50' : ''}
            `}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <card.icon size={14} className={card.iconClassName} />
              <p className={`text-xs ${hasCount ? card.iconClassName : 'text-darklink'}`}>
                {card.label}
              </p>
            </div>
            <p className={`text-xl font-bold ${hasCount ? 'text-ld' : 'text-darklink'}`}>
              {count.toLocaleString('fr-FR')}
            </p>
            {isClickable && (
              <p className="text-[10px] text-darklink mt-1">Cliquer pour voir</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
