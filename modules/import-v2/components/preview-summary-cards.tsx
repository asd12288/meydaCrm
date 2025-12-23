/**
 * Preview Summary Cards Component
 *
 * 5 clickable stat cards showing import preview summary:
 * Total | Valid | Invalid | File Dup | DB Dup
 */

'use client';

import {
  IconFiles,
  IconCheck,
  IconAlertTriangle,
  IconCopy,
  IconDatabase,
} from '@tabler/icons-react';
import type { PreviewSummaryV2, PreviewTabV2 } from '../types/preview';

// =============================================================================
// TYPES
// =============================================================================

interface PreviewSummaryCardsProps {
  /** Summary data */
  summary: PreviewSummaryV2;
  /** Currently active tab (for highlighting) */
  activeTab?: PreviewTabV2 | null;
  /** Callback when a card is clicked */
  onCardClick?: (tab: PreviewTabV2 | null) => void;
  /** Whether cards are clickable */
  interactive?: boolean;
}

interface SummaryCardConfig {
  id: PreviewTabV2 | null;
  label: string;
  icon: typeof IconFiles;
  getValue: (summary: PreviewSummaryV2) => number;
  variant: 'neutral' | 'success' | 'error' | 'warning' | 'info';
}

// =============================================================================
// CARD CONFIGURATION
// =============================================================================

const CARD_CONFIGS: SummaryCardConfig[] = [
  {
    id: null,
    label: 'Total',
    icon: IconFiles,
    getValue: (s) => s.total,
    variant: 'neutral',
  },
  {
    id: null,
    label: 'Valides',
    icon: IconCheck,
    getValue: (s) => s.valid,
    variant: 'success',
  },
  {
    id: 'invalid',
    label: 'Invalides',
    icon: IconAlertTriangle,
    getValue: (s) => s.invalid,
    variant: 'error',
  },
  {
    id: 'file_duplicates',
    label: 'Doublons fichier',
    icon: IconCopy,
    getValue: (s) => s.fileDuplicates,
    variant: 'warning',
  },
  {
    id: 'db_duplicates',
    label: 'Doublons base',
    icon: IconDatabase,
    getValue: (s) => s.dbDuplicates,
    variant: 'info',
  },
];

// =============================================================================
// VARIANT STYLES
// =============================================================================

const VARIANT_STYLES = {
  neutral: {
    container: 'bg-lightgray dark:bg-dark',
    icon: 'text-darklink',
    iconBg: 'bg-white dark:bg-darkborder',
    border: 'border-border dark:border-darkborder',
    activeBorder: 'border-darklink',
  },
  success: {
    container: 'bg-lightsuccess/50 dark:bg-success/10',
    icon: 'text-success',
    iconBg: 'bg-white dark:bg-success/20',
    border: 'border-success/20 dark:border-success/30',
    activeBorder: 'border-success',
  },
  error: {
    container: 'bg-lighterror/50 dark:bg-error/10',
    icon: 'text-error',
    iconBg: 'bg-white dark:bg-error/20',
    border: 'border-error/20 dark:border-error/30',
    activeBorder: 'border-error',
  },
  warning: {
    container: 'bg-lightwarning/50 dark:bg-warning/10',
    icon: 'text-warning',
    iconBg: 'bg-white dark:bg-warning/20',
    border: 'border-warning/20 dark:border-warning/30',
    activeBorder: 'border-warning',
  },
  info: {
    container: 'bg-lightprimary/50 dark:bg-primary/10',
    icon: 'text-primary',
    iconBg: 'bg-white dark:bg-primary/20',
    border: 'border-primary/20 dark:border-primary/30',
    activeBorder: 'border-primary',
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function PreviewSummaryCards({
  summary,
  activeTab,
  onCardClick,
  interactive = true,
}: PreviewSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {CARD_CONFIGS.map((config) => {
        const value = config.getValue(summary);
        const styles = VARIANT_STYLES[config.variant];
        const isActive = activeTab === config.id;
        const isClickable = interactive && config.id !== null && value > 0;
        const Icon = config.icon;

        return (
          <button
            key={config.label}
            type="button"
            onClick={() => isClickable && onCardClick?.(config.id)}
            disabled={!isClickable}
            className={`
              relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
              ${styles.container}
              ${isActive ? styles.activeBorder : styles.border}
              ${isClickable ? 'cursor-pointer hover:scale-[1.02] hover:shadow-md' : 'cursor-default'}
              ${isActive ? 'ring-2 ring-offset-1 ring-offset-white dark:ring-offset-dark ring-opacity-50' : ''}
              ${config.variant === 'neutral' ? '' : isActive ? `ring-${config.variant}` : ''}
            `}
          >
            {/* Icon */}
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${styles.iconBg}
              `}
            >
              <Icon size={20} className={styles.icon} />
            </div>

            {/* Value */}
            <span className="text-2xl font-bold text-ld">{value.toLocaleString('fr-FR')}</span>

            {/* Label */}
            <span className="text-xs text-darklink font-medium">{config.label}</span>

            {/* Active indicator */}
            {isActive && (
              <div
                className={`
                  absolute -bottom-0.5 left-1/2 -translate-x-1/2
                  w-8 h-1 rounded-full
                  ${config.variant === 'error' ? 'bg-error' : ''}
                  ${config.variant === 'warning' ? 'bg-warning' : ''}
                  ${config.variant === 'info' ? 'bg-primary' : ''}
                `}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

export function PreviewSummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {CARD_CONFIGS.map((config) => (
        <div
          key={config.label}
          className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border dark:border-darkborder bg-lightgray dark:bg-dark animate-pulse"
        >
          <div className="w-10 h-10 rounded-full bg-border dark:bg-darkborder" />
          <div className="w-12 h-7 rounded bg-border dark:bg-darkborder" />
          <div className="w-16 h-3 rounded bg-border dark:bg-darkborder" />
        </div>
      ))}
    </div>
  );
}
