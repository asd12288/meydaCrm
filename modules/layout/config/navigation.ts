import {
  IconLayoutDashboard,
  IconUsers,
  IconAddressBook,
  IconUpload,
  IconUser,
  IconHeadset,
  IconCreditCard,
  IconNote,
} from '@tabler/icons-react';
import type { ComponentType } from 'react';

export interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  adminOnly?: boolean;
  roles?: string[]; // Array of roles that can see this item (alternative to adminOnly)
  group: 'main' | 'admin' | 'account';
}

export interface NavGroup {
  id: string;
  label: string;
  adminOnly?: boolean;
}

export const navGroups: NavGroup[] = [
  { id: 'main', label: 'Menu' },
  { id: 'admin', label: 'Administration', adminOnly: true },
  { id: 'account', label: 'Compte' },
];

export const navigationItems: NavItem[] = [
  // Main group
  {
    id: 'dashboard',
    title: 'Tableau de bord',
    href: '/dashboard',
    icon: IconLayoutDashboard,
    group: 'main',
  },
  {
    id: 'leads',
    title: 'Leads',
    href: '/leads',
    icon: IconAddressBook,
    group: 'main',
  },
  {
    id: 'notes',
    title: 'Mes notes',
    href: '/notes',
    icon: IconNote,
    group: 'main',
  },
  // Admin group
  {
    id: 'users',
    title: 'Utilisateurs',
    href: '/users',
    icon: IconUsers,
    adminOnly: true,
    group: 'admin',
  },
  {
    id: 'import',
    title: 'Import',
    href: '/import-v2',
    icon: IconUpload,
    adminOnly: true,
    group: 'admin',
  },
  {
    id: 'subscription',
    title: 'Abonnement',
    href: '/subscription',
    icon: IconCreditCard,
    adminOnly: true,
    group: 'admin',
  },
  {
    id: 'support',
    title: 'Support',
    href: '/support',
    icon: IconHeadset,
    roles: ['admin', 'developer'],
    group: 'admin',
  },
  // Account group
  {
    id: 'account',
    title: 'Mon compte',
    href: '/account',
    icon: IconUser,
    group: 'account',
  },
];
