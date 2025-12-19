'use client';

import { useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import {
  IconSearch,
  IconX,
  IconFilter,
  IconUser,
  IconCalendarEvent,
  IconPhoneOff,
  IconPhoneX,
  IconBan,
  IconThumbDown,
  IconCash,
  IconPhoneCall,
  IconRefresh,
  IconMail,
} from '@tabler/icons-react';
import { FilterDropdown, type FilterOption, UserAvatar } from '@/modules/shared';
import { useFilterNavigation } from '../hooks/use-filter-navigation';
import { LEAD_STATUS_OPTIONS, STATUS_COLORS, SEARCH_DEBOUNCE_MS } from '../config/constants';
import type { SalesUser } from '../types';

// Map status to icon component
const STATUS_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  rdv: IconCalendarEvent,
  no_answer_1: IconPhoneOff,
  no_answer_2: IconPhoneX,
  wrong_number: IconBan,
  not_interested: IconThumbDown,
  deposit: IconCash,
  callback: IconPhoneCall,
  relance: IconRefresh,
  mail: IconMail,
};

// Map badge classes to text color classes
const BADGE_TO_TEXT_COLOR: Record<string, string> = {
  'badge-success': 'text-success',
  'badge-warning': 'text-warning',
  'badge-error': 'text-error',
  'badge-info': 'text-info',
  'badge-primary': 'text-primary',
  'badge-secondary': 'text-secondary',
};

interface LeadFiltersProps {
  salesUsers: SalesUser[];
  isAdmin: boolean;
}

export function LeadFilters({ salesUsers, isAdmin }: LeadFiltersProps) {
  const { searchParams, updateFilter, clearFilters } = useFilterNavigation();

  const currentSearch = searchParams.get('search') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentAssignee = searchParams.get('assignedTo') || '';

  const handleSearch = useDebouncedCallback((term: string) => {
    updateFilter('search', term);
  }, SEARCH_DEBOUNCE_MS);

  const hasActiveFilters = currentSearch || currentStatus || currentAssignee;

  // Convert status options to FilterOption format with icons and colors
  const statusOptions: FilterOption[] = useMemo(
    () =>
      LEAD_STATUS_OPTIONS.map((opt) => {
        const badgeClass = STATUS_COLORS[opt.value] || 'badge-primary';
        const textColorClass = BADGE_TO_TEXT_COLOR[badgeClass] || 'text-primary';
        return {
          value: opt.value,
          label: opt.label,
          icon: STATUS_ICON_MAP[opt.value],
          iconColorClass: textColorClass,
        };
      }),
    []
  );

  // Convert sales users to FilterOption format
  const assigneeOptions: FilterOption[] = useMemo(
    () =>
      salesUsers.map((user) => ({
        value: user.id,
        label: user.display_name || 'Sans nom',
      })),
    [salesUsers]
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

      {/* Status filter dropdown */}
      <FilterDropdown
        options={statusOptions}
        value={currentStatus}
        onChange={(value) => updateFilter('status', value)}
        placeholder="Tous les statuts"
        icon={IconFilter}
      />

      {/* Assignee filter (admin only) */}
      {isAdmin && (
        <FilterDropdown
          options={assigneeOptions}
          value={currentAssignee}
          onChange={(value) => updateFilter('assignedTo', value)}
          placeholder="Tous les commerciaux"
          icon={IconUser}
          className="min-w-56"
          renderOption={(option) => (
            <span className="flex items-center gap-2">
              <UserAvatar name={option.label} size="sm" />
              <span className="truncate">{option.label}</span>
            </span>
          )}
          renderSelected={(option) => (
            <span className="flex items-center gap-2">
              <UserAvatar name={option.label} size="sm" />
              <span className="truncate">{option.label}</span>
            </span>
          )}
        />
      )}

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
