'use client';

import { useMemo, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { IconSearch, IconX, IconFilter } from '@tabler/icons-react';
import { FilterDropdown, type FilterOption } from '@/modules/shared';
import { ROLE_OPTIONS, ROLE_LABELS } from '@/lib/constants';
import { ROLE_COLORS } from '../config/constants';
import { useFilterNavigation } from '../hooks/use-filter-navigation';

// Map badge classes to text color classes
const BADGE_TO_TEXT_COLOR: Record<string, string> = {
  'badge-primary': 'text-primary',
  'badge-secondary': 'text-secondary',
  'badge-info': 'text-info',
};

export function UserFilters() {
  const { searchParams, updateFilter, clearFilters } = useFilterNavigation();
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

  const currentSearch = searchParams.get('search') || '';
  const currentRole = searchParams.get('role') || '';

  const hasActiveFilters = currentSearch || currentRole;

  // Convert role options to FilterOption format with colors (exclude developer role)
  const roleOptions: FilterOption[] = useMemo(
    () =>
      ROLE_OPTIONS.filter((opt) => opt.value !== 'developer').map((opt) => {
        const badgeClass = ROLE_COLORS[opt.value as keyof typeof ROLE_COLORS] || 'badge-primary';
        const textColorClass = BADGE_TO_TEXT_COLOR[badgeClass] || 'text-primary';
        return {
          value: opt.value,
          label: ROLE_LABELS[opt.value as keyof typeof ROLE_LABELS] || opt.label,
          iconColorClass: textColorClass,
        };
      }),
    []
  );

  // Debounce search to avoid too many URL updates
  const handleSearch = useDebouncedCallback((term: string) => {
    updateFilter('search', term);
  }, 300);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    handleSearch(value);
  };

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
          placeholder="Rechercher un utilisateur..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full h-10 pl-9 pr-3 text-sm border rounded-md bg-white dark:bg-darkgray border-ld focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      {/* Role filter dropdown */}
      <FilterDropdown
        options={roleOptions}
        value={currentRole}
        onChange={(value) => updateFilter('role', value)}
        placeholder="Tous les rôles"
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
