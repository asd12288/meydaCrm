'use client';

import { IconChevronUp, IconChevronDown, IconSelector } from '@tabler/icons-react';
import { useFilterNavigation } from '../hooks/use-filter-navigation';

interface SortableHeaderProps {
  columnId: string;
  label: string;
}

/**
 * Sortable table header component
 * Shows sort direction indicator and handles click to toggle sort
 */
export function SortableHeader({ columnId, label }: SortableHeaderProps) {
  const { toggleSort, currentSort, currentOrder } = useFilterNavigation();
  const isActive = currentSort === columnId;

  return (
    <button
      type="button"
      onClick={() => toggleSort(columnId)}
      className="flex items-center gap-1 hover:text-primary transition-colors group"
    >
      <span>{label}</span>
      <span className="text-darklink group-hover:text-primary">
        {isActive ? (
          currentOrder === 'asc' ? (
            <IconChevronUp size={14} />
          ) : (
            <IconChevronDown size={14} />
          )
        ) : (
          <IconSelector size={14} className="opacity-50" />
        )}
      </span>
    </button>
  );
}
