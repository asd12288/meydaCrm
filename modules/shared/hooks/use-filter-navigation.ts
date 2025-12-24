'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export interface UseFilterNavigationOptions {
  /** Default sort column when none is specified in URL */
  defaultSort?: string;
  /** Default sort order when none is specified in URL */
  defaultOrder?: 'asc' | 'desc';
}

/**
 * Hook for managing URL-based filter navigation
 * Extracts common filter/sort logic used across list views
 */
export function useFilterNavigation(options: UseFilterNavigationOptions = {}) {
  const { defaultSort = 'created_at', defaultOrder = 'desc' } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * Update a single filter parameter in the URL
   * Resets to page 1 when filters change
   */
  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 on filter change
      params.set('page', '1');
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  /**
   * Update multiple filter parameters at once
   */
  const updateFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      params.set('page', '1');
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  /**
   * Clear all filters and reset to default state
   */
  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  /**
   * Go to a specific page
   */
  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(page));
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  /**
   * Set page size and reset to page 1
   */
  const setPageSize = useCallback(
    (size: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('pageSize', String(size));
      params.set('page', '1');
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  /**
   * Toggle sort order for a column
   * If clicking same column, toggles asc/desc
   * If clicking different column, sets to desc (default)
   */
  const toggleSort = useCallback(
    (columnId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const currentSortBy = params.get('sortBy');
      const currentOrder = params.get('sortOrder') || defaultOrder;

      if (currentSortBy === columnId) {
        // Toggle order
        params.set('sortOrder', currentOrder === 'asc' ? 'desc' : 'asc');
      } else {
        // New column, default to desc
        params.set('sortBy', columnId);
        params.set('sortOrder', 'desc');
      }
      params.set('page', '1');
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams, defaultOrder]
  );

  return {
    searchParams,
    updateFilter,
    updateFilters,
    clearFilters,
    goToPage,
    setPageSize,
    toggleSort,
    // Current values
    currentSort: searchParams.get('sortBy') || defaultSort,
    currentOrder: (searchParams.get('sortOrder') || defaultOrder) as 'asc' | 'desc',
  };
}
