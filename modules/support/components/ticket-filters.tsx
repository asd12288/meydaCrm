'use client';

import { useMemo } from 'react';
import { IconX, IconFilter } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { FilterDropdown, SearchInput, type FilterOption } from '@/modules/shared';
import { useFilterNavigation } from '../hooks/use-filter-navigation';
import {
  TICKET_CATEGORY_OPTIONS,
  TICKET_STATUS_OPTIONS,
  TICKET_CATEGORY_ICONS,
  TICKET_STATUS_COLORS,
} from '../config/constants';

// Map badge classes to text color classes
const BADGE_TO_TEXT_COLOR: Record<string, string> = {
  'badge-success': 'text-success',
  'badge-warning': 'text-warning',
  'badge-error': 'text-error',
  'badge-info': 'text-info',
  'badge-primary': 'text-primary',
  'badge-secondary': 'text-secondary',
};

export function TicketFilters() {
  const { searchParams, updateFilter, clearFilters } = useFilterNavigation();

  const currentSearch = searchParams.get('search') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentStatus = searchParams.get('status') || '';

  const hasActiveFilters = currentSearch || currentCategory || currentStatus;

  // Convert category options to FilterOption format with icons
  const categoryOptions: FilterOption[] = useMemo(
    () =>
      TICKET_CATEGORY_OPTIONS.map((opt) => {
        const Icon = TICKET_CATEGORY_ICONS[opt.value];
        return {
          value: opt.value,
          label: opt.label,
          icon: Icon,
        };
      }),
    []
  );

  // Convert status options to FilterOption format with colors
  const statusOptions: FilterOption[] = useMemo(
    () =>
      TICKET_STATUS_OPTIONS.map((opt) => {
        const color = TICKET_STATUS_COLORS[opt.value];
        const badgeClass = `badge-${color}`;
        const textColorClass = BADGE_TO_TEXT_COLOR[badgeClass] || 'text-primary';
        return {
          value: opt.value,
          label: opt.label,
          iconColorClass: textColorClass,
        };
      }),
    []
  );

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* Search input */}
      <SearchInput
        value={currentSearch}
        placeholder="Rechercher..."
        onSearch={(value) => updateFilter('search', value)}
      />

      {/* Category filter dropdown */}
      <FilterDropdown
        options={categoryOptions}
        value={currentCategory}
        onChange={(value) => updateFilter('category', value)}
        placeholder="Toutes les catégories"
        icon={IconFilter}
      />

      {/* Status filter dropdown */}
      <FilterDropdown
        options={statusOptions}
        value={currentStatus}
        onChange={(value) => updateFilter('status', value)}
        placeholder="Tous les statuts"
        icon={IconFilter}
      />

      {/* Clear filters button */}
      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghostDanger"
          size="sm"
          onClick={clearFilters}
          className="h-10"
        >
          <IconX size={16} />
          Effacer
        </Button>
      )}
    </div>
  );
}
