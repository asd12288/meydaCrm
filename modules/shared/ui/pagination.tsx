'use client';

import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconChevronDown,
  IconCheck,
} from '@tabler/icons-react';
import { Button } from './button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from './dropdown-menu';

export interface PaginationProps {
  /** Total number of items */
  total: number;
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Page size options for the selector */
  pageSizeOptions?: number[];
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Label for total count (e.g., "leads", "utilisateurs", "tickets") */
  itemLabel?: string;
  /** Show page size selector */
  showPageSizeSelector?: boolean;
  /** Show first/last page buttons */
  showFirstLastButtons?: boolean;
  /** Whether the total is an estimated count (shows "~" prefix) */
  isEstimated?: boolean;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * Shared pagination component for all list views
 * Provides consistent pagination UI across leads, users, tickets, etc.
 */
export function Pagination({
  total,
  page,
  pageSize,
  totalPages,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'éléments',
  showPageSizeSelector = true,
  showFirstLastButtons = true,
  isEstimated = false,
}: PaginationProps) {
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  // Don't render if there's nothing to paginate
  if (total === 0 && totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-ld">
      {/* Total count */}
      <span className="text-sm text-darklink whitespace-nowrap">
        {isEstimated ? '~' : ''}{total.toLocaleString('fr-FR')} {itemLabel} au total
      </span>

      {/* Pagination controls */}
      <div className="flex items-center gap-4">
        {/* Page info */}
        <span className="text-sm text-darklink whitespace-nowrap">
          Page {page} sur {totalPages || 1}
        </span>

        {/* Page size selector */}
        {showPageSizeSelector && onPageSizeChange && (
          <DropdownMenu
            position="top-right"
            widthClass="w-20"
            trigger={(isOpen) => (
              <Button
                variant="outline"
                size="default"
                className={`w-16 justify-between ${isOpen ? 'border-primary ring-1 ring-primary/20' : ''}`}
              >
                <span>{pageSize}</span>
                <IconChevronDown
                  size={14}
                  className={`text-darklink transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </Button>
            )}
          >
            <DropdownMenuContent>
              {pageSizeOptions.map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => onPageSizeChange(size)}
                  className={pageSize === size ? 'bg-lightprimary dark:bg-primary/10 font-medium' : ''}
                >
                  <span className="flex items-center gap-2">
                    {pageSize === size && <IconCheck size={14} className="text-primary" />}
                    <span className={pageSize !== size ? 'ml-5' : ''}>{size}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          {showFirstLastButtons && (
            <Button
              type="button"
              variant="pagination"
              size="circle"
              onClick={() => onPageChange(1)}
              disabled={!canGoPrevious}
              title="Première page"
            >
              <IconChevronsLeft size={18} />
            </Button>
          )}
          <Button
            type="button"
            variant="pagination"
            size="circle"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoPrevious}
            title="Page précédente"
          >
            <IconChevronLeft size={18} />
          </Button>
          <Button
            type="button"
            variant="pagination"
            size="circle"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoNext}
            title="Page suivante"
          >
            <IconChevronRight size={18} />
          </Button>
          {showFirstLastButtons && (
            <Button
              type="button"
              variant="pagination"
              size="circle"
              onClick={() => onPageChange(totalPages)}
              disabled={!canGoNext}
              title="Dernière page"
            >
              <IconChevronsRight size={18} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
