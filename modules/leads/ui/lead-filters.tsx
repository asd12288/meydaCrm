'use client';

import { useMemo, useState } from 'react';
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
import { LEAD_STATUS_OPTIONS, STATUS_COLORS, SEARCH_DEBOUNCE_MS, MIN_SEARCH_LENGTH } from '../config/constants';
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
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

  const currentSearch = searchParams.get('search') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentAssignee = searchParams.get('assignedTo') || '';

  // Show hint when user types but hasn't reached minimum length
  const showSearchHint = searchValue.length > 0 && searchValue.length < MIN_SEARCH_LENGTH;

  const handleSearch = useDebouncedCallback((term: string) => {
    // Only trigger search if empty or meets minimum length
    if (term.length === 0 || term.length >= MIN_SEARCH_LENGTH) {
      updateFilter('search', term);
    }
  }, SEARCH_DEBOUNCE_MS);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    handleSearch(value);
  };

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

  // Create a lookup map for user avatars
  const userAvatarMap = useMemo(
    () => new Map(salesUsers.map((user) => [user.id, user.avatar])),
    [salesUsers]
  );

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* Search input with minimum length hint */}
      <div className="relative">
        <div className="relative w-64">
          <IconSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-darklink pointer-events-none"
          />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={`w-full h-10 pl-9 pr-3 text-sm border rounded-md bg-white dark:bg-darkgray focus:outline-none transition-colors ${
              showSearchHint 
                ? 'border-warning focus:border-warning' 
                : 'border-ld focus:border-primary'
            }`}
          />
        </div>
        {showSearchHint && (
          <p className="absolute -bottom-5 left-0 text-xs text-warning">
            Min. {MIN_SEARCH_LENGTH} caractères
          </p>
        )}
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
          className="min-w-48 max-w-56"
          menuMaxWidth="max-w-64"
          scrollable
          renderOption={(option) => (
            <span className="flex items-center gap-2 min-w-0">
              <UserAvatar name={option.label} avatar={userAvatarMap.get(option.value)} size="sm" className="shrink-0" />
              <span className="truncate">{option.label}</span>
            </span>
          )}
          renderSelected={(option) => (
            <span className="flex items-center gap-2 min-w-0">
              <UserAvatar name={option.label} avatar={userAvatarMap.get(option.value)} size="sm" className="shrink-0" />
              <span className="truncate max-w-28">{option.label}</span>
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
