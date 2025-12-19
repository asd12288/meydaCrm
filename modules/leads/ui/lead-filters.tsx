'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { IconSearch, IconX } from '@tabler/icons-react';
import { LEAD_STATUS_OPTIONS } from '../config/constants';
import type { SalesUser } from '../types';

interface LeadFiltersProps {
  salesUsers: SalesUser[];
  isAdmin: boolean;
}

export function LeadFilters({ salesUsers, isAdmin }: LeadFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('search') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentAssignee = searchParams.get('assignedTo') || '';

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 on filter change
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = useDebouncedCallback((term: string) => {
    updateFilters('search', term);
  }, 300);

  const clearFilters = () => {
    router.push(pathname);
  };

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
        onChange={(e) => updateFilters('status', e.target.value)}
        className="h-10 w-44 px-3 text-sm border border-ld rounded-md bg-white dark:bg-darkgray dark:text-white focus:border-primary focus:outline-none cursor-pointer"
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
          onChange={(e) => updateFilters('assignedTo', e.target.value)}
          className="h-10 w-48 px-3 text-sm border border-ld rounded-md bg-white dark:bg-darkgray dark:text-white focus:border-primary focus:outline-none cursor-pointer"
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
