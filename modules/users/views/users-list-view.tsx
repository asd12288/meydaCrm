import { getCurrentUser } from '@/modules/auth';
import { getUsers } from '../lib/actions';
import { userFiltersSchema } from '../types';
import { UsersListClient } from './users-list-client';

interface UsersListViewProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function UsersListView({ searchParams }: UsersListViewProps) {
  // Await and parse search params
  const params = await searchParams;

  // Parse filters from URL params with defaults
  const filters = userFiltersSchema.parse({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    role: params.role,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  // Fetch data in parallel
  const [usersData, currentUser] = await Promise.all([
    getUsers(filters),
    getCurrentUser(),
  ]);

  return (
    <UsersListClient
      users={usersData.users}
      currentUserId={currentUser?.id || ''}
      total={usersData.total}
      page={usersData.page}
      pageSize={usersData.pageSize}
      totalPages={usersData.totalPages}
    />
  );
}
