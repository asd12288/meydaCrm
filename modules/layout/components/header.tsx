'use client';

import { IconLogout, IconUser } from '@tabler/icons-react';
import Link from 'next/link';
import { logout } from '@/modules/auth/lib/actions';

interface HeaderProps {
  displayName: string;
  role: string;
}

export function Header({ displayName, role }: HeaderProps) {
  const roleLabel = role === 'admin' ? 'Administrateur' : 'Commercial';

  return (
    <header className="sticky top-0 z-30 h-[70px] bg-white dark:bg-darkgray border-b border-ld">
      <div className="flex items-center justify-between h-full px-6">
        <div>{/* Breadcrumb or page title can go here */}</div>

        <div className="flex items-center gap-4">
          {/* User info */}
          <div className="text-right">
            <p className="text-sm font-medium text-ld">{displayName}</p>
            <p className="text-xs text-darklink">{roleLabel}</p>
          </div>

          {/* Profile link */}
          <Link
            href="/account"
            className="btn-circle-hover"
            title="Mon compte"
          >
            <IconUser size={20} />
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
