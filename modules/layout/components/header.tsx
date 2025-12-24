'use client';

import { IconLogout, IconUser, IconChevronDown, IconShield } from '@tabler/icons-react';
import { Button } from '@/modules/shared';
import { logout } from '@/modules/auth/lib/actions';
import {
  ThemeSwitcher,
  UserAvatar,
  DropdownMenu,
  DropdownMenuHeader,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuDivider,
} from '@/modules/shared';
import { NotificationBell } from '@/modules/notifications';

interface HeaderProps {
  displayName: string;
  role: string;
  avatar?: string | null; // Temporarily optional for video test
}

export function Header({ displayName, role, avatar }: HeaderProps) {
  const isAdmin = role === 'admin';
  const roleLabel = role === 'admin'
    ? 'Administrateur'
    : role === 'developer'
      ? 'Développeur'
      : 'Commercial';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-darkgray/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="flex items-center justify-between h-full px-4 lg:px-5 xl:px-6">
        {/* Left side - can add breadcrumb or search here */}
        <div className="flex items-center gap-4">
          {/* Placeholder for future breadcrumb/search */}
        </div>

        {/* Right side - user actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <ThemeSwitcher />

          {/* Divider */}
          <div className="w-px h-8 bg-border mx-2" />

          {/* Notifications */}
          <NotificationBell />

          {/* Divider */}
          <div className="w-px h-8 bg-border mx-2" />

          {/* User dropdown */}
          <DropdownMenu
            position="bottom-right"
            trigger={(isOpen) => (
              <Button
                variant="ghost"
                className="flex items-center gap-3 py-1.5 px-3 h-auto"
              >
                <UserAvatar name={displayName} avatar={avatar} size="md" />
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-ld leading-tight">{displayName}</p>
                  <p className="text-xs text-darklink flex items-center gap-1">
                    {isAdmin && <IconShield size={12} />}
                    {roleLabel}
                  </p>
                </div>
                <IconChevronDown
                  size={16}
                  className={`text-darklink transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </Button>
            )}
          >
            {/* User info header */}
            <DropdownMenuHeader>
              <p className="text-sm font-semibold text-ld">{displayName}</p>
              <p className="text-xs text-darklink">{roleLabel}</p>
            </DropdownMenuHeader>

            {/* Menu items */}
            <DropdownMenuContent>
              <DropdownMenuItem
                href="/account"
                icon={<IconUser size={18} />}
              >
                Mon compte
              </DropdownMenuItem>

              <DropdownMenuDivider />

              <DropdownMenuItem
                variant="danger"
                icon={<IconLogout size={18} />}
                onClick={() => logout()}
              >
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
