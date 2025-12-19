import {
  IconLayoutDashboard,
  IconUsers,
  IconAddressBook,
  IconUpload,
  IconUser,
} from '@tabler/icons-react';
import type { ComponentType } from 'react';

export interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  adminOnly?: boolean;
}

export const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    title: 'Tableau de bord',
    href: '/dashboard',
    icon: IconLayoutDashboard,
  },
  {
    id: 'leads',
    title: 'Leads',
    href: '/leads',
    icon: IconAddressBook,
  },
  {
    id: 'users',
    title: 'Utilisateurs',
    href: '/users',
    icon: IconUsers,
    adminOnly: true,
  },
  {
    id: 'import',
    title: 'Import',
    href: '/import',
    icon: IconUpload,
    adminOnly: true,
  },
  {
    id: 'account',
    title: 'Mon compte',
    href: '/account',
    icon: IconUser,
  },
];
