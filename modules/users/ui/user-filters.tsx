'use client';

import { useMemo } from 'react';
import { IconX, IconFilter } from '@tabler/icons-react';
import { Button } from '@/modules/shared';
import { FilterDropdown, SearchInput, type FilterOption } from '@/modules/shared';
import { USER_ROLE_OPTIONS, ROLE_LABELS } from '@/lib/constants';
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

  const currentSearch = searchParams.get('search') || '';
  const currentRole = searchParams.get('role') || '';

  const hasActiveFilters = currentSearch || currentRole;

  // Convert role options to FilterOption format with colors
  const roleOptions: FilterOption[] = useMemo(
    () =>
      USER_ROLE_OPTIONS.map((opt) => {
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

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* Search input */}
      <SearchInput
        value={currentSearch}
        placeholder="Rechercher un utilisateur..."
        onSearch={(value) => updateFilter('search', value)}
      />

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
