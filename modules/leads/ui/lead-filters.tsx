'use client';

import { useDebouncedCallback } from 'use-debounce';
import { IconSearch, IconX } from '@tabler/icons-react';
import { useFilterNavigation } from '../hooks/use-filter-navigation';
import { LEAD_STATUS_OPTIONS, SEARCH_DEBOUNCE_MS } from '../config/constants';
import type { SalesUser } from '../types';

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

      {/* Status filter */}
      <select
        value={currentStatus}
        onChange={(e) => updateFilter('status', e.target.value)}
        className="form-select-filter"
      >
        <option value="">Tous les statuts</option>
        {LEAD_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Assignee filter (admin only) */}
      {isAdmin && (
        <select
          value={currentAssignee}
          onChange={(e) => updateFilter('assignedTo', e.target.value)}
          className="form-select-filter w-48"
        >
          <option value="">Tous les commerciaux</option>
          {salesUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.display_name || 'Sans nom'}
            </option>
          ))}
        </select>
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
