'use client';

import { Pagination } from '@/modules/shared';
import { useFilterNavigation } from '../hooks/use-filter-navigation';
import { PAGE_SIZE_OPTIONS } from '../config/constants';

interface LeadsPaginationProps {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** Whether the total count is estimated (faster) or exact */
  isEstimated?: boolean;
}

export function LeadsPagination({
  total,
  page,
  pageSize,
  totalPages,
  isEstimated = false,
}: LeadsPaginationProps) {
  const { goToPage, setPageSize } = useFilterNavigation();

  return (
    <Pagination
      total={total}
      page={page}
      pageSize={pageSize}
      totalPages={totalPages}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      onPageChange={goToPage}
      onPageSizeChange={setPageSize}
      itemLabel="leads"
      isEstimated={isEstimated}
    />
  );
}
