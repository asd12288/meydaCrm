'use client';

import { useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { IconSearch, IconX, IconFilter } from '@tabler/icons-react';
import { FilterDropdown, type FilterOption } from '@/modules/shared';
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

const SEARCH_DEBOUNCE_MS = 300;

export function TicketFilters() {
  const { searchParams, updateFilter, clearFilters } = useFilterNavigation();

  const currentSearch = searchParams.get('search') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentStatus = searchParams.get('status') || '';

  const handleSearch = useDebouncedCallback((term: string) => {
    updateFilter('search', term);
  }, SEARCH_DEBOUNCE_MS);

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
      <div className="relative w-64">
        <IconSearch
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-darklink pointer-events-none"
        />
        <input
          type="text"
          placeholder="Rechercher..."
          defaultValue={currentSearch}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-3 text-sm border border-ld rounded-md bg-white dark:bg-darkgray focus:border-primary focus:outline-none"
        />
      </div>

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
        <button
          type="button"
          onClick={clearFilters}
          className="h-10 flex items-center gap-1 px-3 text-sm text-darklink hover:text-error transition-colors"
        >
          <IconX size={16} />
          Effacer
        </button>
      )}
    </div>
  );
}
