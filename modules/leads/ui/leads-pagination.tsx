'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-react';
import { PAGE_SIZE_OPTIONS } from '../config/constants';

interface LeadsPaginationProps {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function LeadsPagination({
  total,
  page,
  pageSize,
  totalPages,
}: LeadsPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  const setPageSize = (newSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('pageSize', String(newSize));
    params.set('page', '1'); // Reset to first page
    router.push(`${pathname}?${params.toString()}`);
  };

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-ld">
      {/* Total count */}
      <span className="text-sm text-darklink whitespace-nowrap">
        {total} leads au total
      </span>

      {/* Pagination controls */}
      <div className="flex items-center gap-4">
        {/* Page info */}
        <span className="text-sm text-darklink whitespace-nowrap">
          Page {page} sur {totalPages || 1}
        </span>

        {/* Page size selector */}
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="h-9 w-16 px-2 text-sm border border-ld rounded-md bg-white dark:bg-darkgray dark:text-white focus:border-primary focus:outline-none cursor-pointer"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goToPage(1)}
            disabled={!canGoPrevious}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-lightprimary hover:text-primary dark:hover:bg-darkmuted transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-current"
            title="Premiere page"
          >
            <IconChevronsLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={!canGoPrevious}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-lightprimary hover:text-primary dark:hover:bg-darkmuted transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-current"
            title="Page precedente"
          >
            <IconChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={!canGoNext}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-lightprimary hover:text-primary dark:hover:bg-darkmuted transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-current"
            title="Page suivante"
          >
            <IconChevronRight size={18} />
          </button>
          <button
            type="button"
            onClick={() => goToPage(totalPages)}
            disabled={!canGoNext}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-lightprimary hover:text-primary dark:hover:bg-darkmuted transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-current"
            title="Derniere page"
          >
            <IconChevronsRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
