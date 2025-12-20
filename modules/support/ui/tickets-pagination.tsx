'use client';

import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useFilterNavigation } from '../hooks/use-filter-navigation';

interface TicketsPaginationProps {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function TicketsPagination({
  total,
  page,
  pageSize,
  totalPages,
}: TicketsPaginationProps) {
  const { goToPage } = useFilterNavigation();

  if (totalPages <= 1) {
    return null;
  }

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between border-t border-ld pt-4 mt-4">
      <div className="text-sm text-darklink">
        Affichage de {startItem} à {endItem} sur {total} tickets
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
          className="btn-circle-hover disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Page précédente"
        >
          <IconChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              // Show first, last, current, and pages around current
              return (
                p === 1 ||
                p === totalPages ||
                (p >= page - 1 && p <= page + 1)
              );
            })
            .map((p, idx, arr) => {
              // Add ellipsis if there's a gap
              const showEllipsisBefore = idx > 0 && arr[idx - 1] !== p - 1;
              return (
                <div key={p} className="flex items-center gap-1">
                  {showEllipsisBefore && (
                    <span className="px-2 text-darklink">...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => goToPage(p)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      p === page
                        ? 'bg-primary text-white'
                        : 'text-darklink hover:bg-hover'
                    }`}
                  >
                    {p}
                  </button>
                </div>
              );
            })}
        </div>

        <button
          type="button"
          onClick={() => goToPage(page + 1)}
          disabled={page === totalPages}
          className="btn-circle-hover disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Page suivante"
        >
          <IconChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
