import { TableSkeleton } from '@/modules/shared';

export function UsersTableSkeleton() {
  return (
    <TableSkeleton
      headerColumns={['w-32', 'w-28', 'w-24', 'w-12']}
      rowCount={5}
      rowColumns={[
        'skeleton skeleton-text w-40',
        'skeleton w-24 h-6 rounded-full',
        'skeleton skeleton-text w-24',
        'skeleton w-8 h-8 rounded-full',
      ]}
      headerGap="gap-8"
    />
  );
}
