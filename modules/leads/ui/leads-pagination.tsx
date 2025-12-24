'use client';

import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { InlineDropdown } from '@/modules/shared';
import { useFilterNavigation } from '../hooks/use-filter-navigation';
import { PAGE_SIZE_OPTIONS } from '../config/constants';

interface LeadsPaginationProps {
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export function LeadsPagination({
  page,
  pageSize,
  hasMore,
}: LeadsPaginationProps) {
  const { goToPage, setPageSize } = useFilterNavigation();

  const hasPrevious = page > 1;

  return (
    <div className="flex items-center justify-between pt-4 border-t border-ld mt-4">
      {/* Page size selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-darklink">Afficher</span>
        <InlineDropdown
          options={PAGE_SIZE_OPTIONS.map((size) => ({
            value: String(size),
            label: String(size),
          }))}
          value={String(pageSize)}
          onChange={(v) => setPageSize(Number(v))}
          widthClass="w-16"
          size="md"
        />
        <span className="text-sm text-darklink">par page</span>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page - 1)}
          disabled={!hasPrevious}
        >
          <IconChevronLeft size={16} />
          Précédent
        </Button>

        <span className="text-sm text-darklink px-2">Page {page}</span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page + 1)}
          disabled={!hasMore}
        >
          Suivant
          <IconChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
