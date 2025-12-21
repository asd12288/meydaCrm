'use client';

import { useMemo, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import {
  IconSearch,
  IconX,
  IconFilter,
  IconUser,
  IconUserOff,
  IconCalendarEvent,
  IconPhoneOff,
  IconPhoneX,
  IconBan,
  IconThumbDown,
  IconCash,
  IconPhoneCall,
  IconRefresh,
  IconMail,
  IconDownload,
  IconLoader2,
  IconSparkles,
} from '@tabler/icons-react';
import { FilterDropdown, type FilterOption, UserAvatar, useToast } from '@/modules/shared';
import { Button } from '@/components/ui/button';
import { FR_MESSAGES } from '@/lib/errors';
import { useFilterNavigation } from '../hooks/use-filter-navigation';
import { LEAD_STATUS_OPTIONS, STATUS_COLORS, SEARCH_DEBOUNCE_MS, MIN_SEARCH_LENGTH } from '../config/constants';
import { UNASSIGNED_FILTER_VALUE } from '../types';
import type { SalesUser } from '../types';

// Map status to icon component
const STATUS_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  new: IconSparkles,
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
  hideStatusFilter?: boolean;
}

export function LeadFilters({ salesUsers, isAdmin, hideStatusFilter = false }: LeadFiltersProps) {
  const { searchParams, updateFilter, clearFilters } = useFilterNavigation();
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

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

  const hasActiveFilters = currentSearch || (!hideStatusFilter && currentStatus) || currentAssignee;

  // Handle CSV export
  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    toast.info('Préparation de l\'export... Cela peut prendre quelques instants.');

    try {
      // Build export URL with current filters
      const exportParams = new URLSearchParams();
      if (currentSearch) exportParams.set('search', currentSearch);
      if (currentStatus) exportParams.set('status', currentStatus);
      if (currentAssignee) exportParams.set('assignedTo', currentAssignee);
      const sortBy = searchParams.get('sortBy');
      const sortOrder = searchParams.get('sortOrder');
      if (sortBy) exportParams.set('sortBy', sortBy);
      if (sortOrder) exportParams.set('sortOrder', sortOrder);

      const response = await fetch(`/api/leads/export?${exportParams.toString()}`);

      if (!response.ok) {
        if (response.status === 401) {
          toast.error(FR_MESSAGES.SESSION_EXPIRED);
        } else if (response.status === 403) {
          toast.error(FR_MESSAGES.UNAUTHORIZED);
        } else {
          toast.error('Erreur lors de l\'export');
        }
        return;
      }

      // Trigger download with proper cleanup to prevent memory leaks
      let blobUrl: string | null = null;
      try {
        const blob = await response.blob();
        blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Export terminé');
      } finally {
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
      }
    } catch (error) {
      console.error('[Export] Error:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  };

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

  // Convert sales users to FilterOption format with "unassigned" option first
  const assigneeOptions: FilterOption[] = useMemo(
    () => [
      // Add "unassigned" option at the top
      {
        value: UNASSIGNED_FILTER_VALUE,
        label: 'Non assignés',
        icon: IconUserOff,
        iconColorClass: 'text-warning',
      },
      // Then all sales users
      ...salesUsers.map((user) => ({
        value: user.id,
        label: user.display_name || 'Sans nom',
      })),
    ],
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

      {/* Status filter dropdown (hidden in kanban view where columns are statuses) */}
      {!hideStatusFilter && (
        <FilterDropdown
          options={statusOptions}
          value={currentStatus}
          onChange={(value) => updateFilter('status', value)}
          placeholder="Tous les statuts"
          icon={IconFilter}
        />
      )}

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
          renderOption={(option) => {
            // Special rendering for "unassigned" option
            if (option.value === UNASSIGNED_FILTER_VALUE) {
              return (
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                    <IconUserOff size={14} className="text-warning" />
                  </span>
                  <span className="truncate text-warning font-medium">{option.label}</span>
                </span>
              );
            }
            return (
              <span className="flex items-center gap-2 min-w-0">
                <UserAvatar name={option.label} avatar={userAvatarMap.get(option.value)} size="sm" className="shrink-0" />
                <span className="truncate">{option.label}</span>
              </span>
            );
          }}
          renderSelected={(option) => {
            // Special rendering for "unassigned" option
            if (option.value === UNASSIGNED_FILTER_VALUE) {
              return (
                <span className="flex items-center gap-2 min-w-0">
                  <IconUserOff size={16} className="text-warning shrink-0" />
                  <span className="truncate max-w-28 text-warning">{option.label}</span>
                </span>
              );
            }
            return (
              <span className="flex items-center gap-2 min-w-0">
                <UserAvatar name={option.label} avatar={userAvatarMap.get(option.value)} size="sm" className="shrink-0" />
                <span className="truncate max-w-28">{option.label}</span>
              </span>
            );
          }}
        />
      )}

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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Export button (admin only) */}
      {isAdmin && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="h-10"
        >
          {isExporting ? (
            <IconLoader2 size={16} className="animate-spin" />
          ) : (
            <IconDownload size={16} />
          )}
          {isExporting ? 'Export...' : 'Exporter CSV'}
        </Button>
      )}
    </div>
  );
}
