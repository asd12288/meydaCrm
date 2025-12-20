'use client';

import { Pagination } from '@/modules/shared';
import { useFilterNavigation } from '../hooks/use-filter-navigation';
import { PAGE_SIZE_OPTIONS } from '../config/constants';

interface UsersPaginationProps {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function UsersPagination({
  total,
  page,
  pageSize,
  totalPages,
}: UsersPaginationProps) {
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
      itemLabel={total === 1 ? 'utilisateur' : 'utilisateurs'}
    />
  );
}
