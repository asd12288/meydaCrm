'use client';

import { IconLogout } from '@tabler/icons-react';
import Link from 'next/link';
import { logout } from '@/modules/auth/lib/actions';
import { ThemeSwitcher, UserAvatar } from '@/modules/shared';

interface HeaderProps {
  displayName: string;
  role: string;
  avatar: string | null;
}

export function Header({ displayName, role, avatar }: HeaderProps) {
  const roleLabel = role === 'admin' ? 'Administrateur' : 'Commercial';

  return (
    <header className="sticky top-0 z-30 h-17.5 bg-white dark:bg-darkgray border-b border-ld">
      <div className="flex items-center justify-between h-full px-6">
        <div>{/* Breadcrumb or page title can go here */}</div>

        <div className="flex items-center gap-4">
          {/* Theme toggle */}
          <ThemeSwitcher />

          {/* User info */}
          <div className="text-right">
            <p className="text-sm font-medium text-ld">{displayName}</p>
            <p className="text-xs text-darklink">{roleLabel}</p>
          </div>

          {/* Profile link */}
          <Link
            href="/account"
            className="hover:opacity-80 transition-opacity"
            title="Mon compte"
          >
            <UserAvatar name={displayName} avatar={avatar} size="md" />
          </Link>

          {/* Logout */}
          <form action={logout}>
            <button
              type="submit"
              className="btn-circle-hover text-error"
              title="Deconnexion"
            >
              <IconLogout size={20} />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
