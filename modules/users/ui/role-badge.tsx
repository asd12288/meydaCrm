import type { UserRole } from '@/db/types';
import { ROLE_LABELS } from '@/lib/constants';
import { ROLE_COLORS } from '../config/constants';

interface RoleBadgeProps {
  role: UserRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return <span className={`badge ${ROLE_COLORS[role]}`}>{ROLE_LABELS[role]}</span>;
}
