import type { UserRole } from '@/db/types';
import { ROLE_LABELS } from '@/lib/constants';
import { Badge, type BadgeVariant } from '@/modules/shared';

// Map user roles to badge variants
const ROLE_VARIANTS: Record<UserRole, BadgeVariant> = {
  admin: 'primary',
  sales: 'secondary',
};

interface RoleBadgeProps {
  role: UserRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return <Badge variant={ROLE_VARIANTS[role]}>{ROLE_LABELS[role]}</Badge>;
}
