import type { ReactNode } from 'react';
import { IconMoodEmpty } from '@tabler/icons-react';

export interface EmptyStateProps {
  /** Icon to display */
  icon?: ReactNode;
  /** Main message */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional action button */
  action?: ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class name */
  className?: string;
}

const SIZE_CLASSES = {
  sm: {
    container: 'px-4 py-8',
    icon: 32,
    title: 'text-sm',
    description: 'text-xs',
  },
  md: {
    container: 'px-4 py-12',
    icon: 48,
    title: 'text-sm',
    description: 'text-xs',
  },
  lg: {
    container: 'px-6 py-16',
    icon: 64,
    title: 'text-base',
    description: 'text-sm',
  },
};

/**
 * Empty state component for lists, tables, and containers
 * Displays when there's no data to show
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  className = '',
}: EmptyStateProps) {
  const sizeConfig = SIZE_CLASSES[size];

  return (
    <div className={`text-center ${sizeConfig.container} ${className}`}>
      {/* Icon */}
      <div className="mx-auto text-darklink opacity-50 mb-3">
        {icon || <IconMoodEmpty size={sizeConfig.icon} />}
      </div>

      {/* Title */}
      <p className={`font-medium text-darklink ${sizeConfig.title}`}>
        {title}
      </p>

      {/* Description */}
      {description && (
        <p className={`text-darklink mt-1 ${sizeConfig.description}`}>
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}

// ============ Preset empty states ============

export interface EmptyStatePresetProps {
  action?: ReactNode;
  className?: string;
}

/**
 * Empty state for notifications
 */
export function EmptyNotifications({ action, className }: EmptyStatePresetProps) {
  return (
    <EmptyState
      title="Aucune notification"
      description="Vous recevrez des notifications ici"
      action={action}
      className={className}
    />
  );
}

/**
 * Empty state for search results
 */
export function EmptySearchResults({ action, className }: EmptyStatePresetProps) {
  return (
    <EmptyState
      title="Aucun résultat"
      description="Essayez d'ajuster vos filtres"
      action={action}
      className={className}
    />
  );
}

/**
 * Empty state for lists
 */
export function EmptyList({
  itemName = 'élément',
  action,
  className,
}: EmptyStatePresetProps & { itemName?: string }) {
  return (
    <EmptyState
      title={`Aucun ${itemName}`}
      description={`Il n'y a pas encore de ${itemName}s`}
      action={action}
      className={className}
    />
  );
}
