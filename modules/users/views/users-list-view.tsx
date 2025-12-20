import { getCurrentUser } from '@/modules/auth';
import { getUsers } from '../lib/actions';
import { UsersListClient } from './users-list-client';

export async function UsersListView() {
  const [users, currentUser] = await Promise.all([
    getUsers(),
    getCurrentUser(),
  ]);

  return (
    <UsersListClient
      users={users}
      currentUserId={currentUser?.id || ''}
    />
  );
}
